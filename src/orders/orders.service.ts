import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException,} from '@nestjs/common';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { Product } from '../products/product.entity';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { MAX_AMOUNT_CENTS, centsToDecimal, isWithinMoneyLimit, unitPriceCents } from '../common/money';
import { toOrderResponse } from './order.mapper';

// "999.999.999.999" dùng trong thông báo lỗi
const MAX_ORDER_TEXT = new Intl.NumberFormat('vi-VN').format(Math.floor(MAX_AMOUNT_CENTS / 100));

@Injectable()
export class OrdersService {
  constructor(
    @Inject('DATA_SOURCE')
    private readonly dataSource: DataSource,
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: Repository<Order>,
    private readonly paymentsService: PaymentsService,
  ) {}

  // 1. Tạo đơn từ giỏ hàng. Tạo đơn, trừ kho, ghi thanh toán và xóa giỏ nằm trong
  // cùng một transaction: lỗi ở bước nào thì cả transaction bị hoàn tác (rollback).
  async create(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    const orderId = await this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { user: { user_id: userId } },
        relations: { items: { product: true } },
      });
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Giỏ hàng trống, không thể đặt hàng');
      }

      // Tính trước tổng tiền, chưa ghi gì vào database: vượt giới hạn cột DECIMAL(14,2) thì từ chối ngay
      let totalCents = 0;
      const lines: { product: Product; quantity: number; priceCents: number }[] = [];
      for (const item of cart.items) {
        // Giá tại thời điểm đặt: sẽ lưu vào order_items, đổi giá sau này không ảnh hưởng đơn cũ
        const priceCents = unitPriceCents(item.product);
        totalCents += priceCents * item.quantity;
        if (!isWithinMoneyLimit(totalCents)) {
          throw new BadRequestException(
            `Tổng giá trị đơn hàng vượt quá giới hạn cho phép (${MAX_ORDER_TEXT}đ). Vui lòng giảm số lượng hoặc chia thành nhiều đơn`,
          );
        }
        lines.push({ product: item.product, quantity: item.quantity, priceCents });
      }

      for (const line of lines) {
        // Trừ kho bằng một câu UPDATE có điều kiện: hai người đặt cùng lúc
        // cũng không làm tồn kho âm (affected = 0 khi không còn đủ hàng)
        const result = await manager.update(
          Product,
          { product_id: line.product.product_id, is_active: true, stock: MoreThanOrEqual(line.quantity) },
          { stock: () => `stock - ${Number(line.quantity)}` },
        );
        if (!result.affected) {
          throw new BadRequestException(
            `Sản phẩm "${line.product.name}" không đủ hàng hoặc đã ngừng bán`,
          );
        }
      }

      const order = await manager.save(Order, {
        user: { user_id: userId },
        total_amount: centsToDecimal(totalCents),
        status: OrderStatus.PENDING,
        shipping_address: dto.shipping_address,
        phone: dto.phone,
      });
      await manager.save(
        OrderItem,
        lines.map((line) => ({
          order,
          product: line.product,
          quantity: line.quantity,
          price: centsToDecimal(line.priceCents),
        })),
      );
      await this.paymentsService.record(manager, order, dto.payment_method, totalCents);
      await manager.delete(CartItem, cart.items.map((item) => item.cart_item_id));

      return order.order_id;
    });

    return this.findOne(userId, orderId);
  }

  // 2. Lịch sử đơn hàng của tôi, mới nhất trước
  async findAll(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { user: { user_id: userId } },
      relations: { items: { product: true }, payments: true },
      order: { created_at: 'DESC', order_id: 'DESC' },
    });
    return orders.map(toOrderResponse);
  }

  // 3. Chi tiết một đơn, chỉ chủ đơn mới xem được
  async findOne(userId: string, orderId: number): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
      relations: { user: true, items: { product: true }, payments: true },
    });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng có ID = ${orderId}`);
    }
    if (order.user.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }
    return toOrderResponse(order);
  }
}
