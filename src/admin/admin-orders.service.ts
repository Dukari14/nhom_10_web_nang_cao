import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { toOrderResponse } from '../orders/order.mapper';
import { ORDER_STATUS_LABELS, canTransition } from '../orders/order-status';
import { AdminOrderListResponseDto, AdminOrderResponseDto, AdminOrdersQueryDto } from './dto/admin-orders.dto';

const DEFAULT_PAGE_SIZE = 10;

const ORDER_RELATIONS = {
  user: { profile: true },
  items: { product: true },
  payments: true,
} as const;

@Injectable()
export class AdminOrdersService {
  constructor(
    @Inject('DATA_SOURCE')
    private readonly dataSource: DataSource,
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: Repository<Order>,
  ) {}

  // 1. Danh sách đơn của mọi khách, lọc theo trạng thái, phân trang
  async findAll(query: AdminOrdersQueryDto): Promise<AdminOrderListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: query.status ? { status: query.status } : {},
      relations: ORDER_RELATIONS,
      order: { created_at: 'DESC', order_id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: orders.map((order) => this.toAdminResponse(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 2. Đổi trạng thái đơn. Chỉ cho phép các bước hợp lệ (xem order-status.ts).
  async updateStatus(orderId: number, newStatus: OrderStatus): Promise<AdminOrderResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { order_id: orderId },
        relations: { items: { product: true }, payments: true },
      });
      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng có ID = ${orderId}`);
      }
      if (!canTransition(order.status, newStatus)) {
        throw new BadRequestException(
          `Không thể chuyển đơn từ "${ORDER_STATUS_LABELS[order.status]}" sang "${ORDER_STATUS_LABELS[newStatus]}"`,
        );
      }

      // Chỉ cập nhật khi trạng thái vẫn như lúc đọc: hai admin bấm cùng lúc thì người đến sau bị từ chối
      const result = await manager.update(
        Order,
        { order_id: orderId, status: order.status },
        { status: newStatus },
      );
      if (!result.affected) {
        throw new ConflictException('Đơn hàng vừa được người khác cập nhật, vui lòng tải lại trang');
      }

      const pendingPayments = (order.payments ?? []).filter((p) => p.status === PaymentStatus.PENDING);
      if (newStatus === OrderStatus.CANCELLED) {
        // Hủy đơn: trả hàng về kho và đánh dấu thanh toán thất bại
        for (const item of order.items) {
          await manager.increment(Product, { product_id: item.product.product_id }, 'stock', item.quantity);
        }
        await this.setPaymentStatus(manager, pendingPayments, PaymentStatus.FAILED);
      } else if (newStatus === OrderStatus.DELIVERED) {
        // Giao xong thì khách đã trả tiền (COD) hoặc đã chuyển khoản
        await this.setPaymentStatus(manager, pendingPayments, PaymentStatus.COMPLETED);
      }
    });

    const updated = await this.orderRepository.findOne({
      where: { order_id: orderId },
      relations: ORDER_RELATIONS,
    });
    return this.toAdminResponse(updated!);
  }

  private async setPaymentStatus(
    manager: DataSource['manager'],
    payments: Payment[],
    status: PaymentStatus,
  ): Promise<void> {
    for (const payment of payments) {
      await manager.update(Payment, payment.payment_id, { status });
    }
  }

  private toAdminResponse(order: Order): AdminOrderResponseDto {
    return {
      ...toOrderResponse(order),
      customer: {
        user_id: order.user.user_id,
        email: order.user.email,
        full_name: order.user.profile?.full_name ?? null,
      },
    };
  }
}
