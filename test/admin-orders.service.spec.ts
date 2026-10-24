import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminOrdersService } from '../src/admin/admin-orders.service';
import { Order, OrderStatus } from '../src/orders/order.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../src/payments/payment.entity';
import { Product } from '../src/products/product.entity';
import { ORDER_STATUS_TRANSITIONS, canTransition } from '../src/orders/order-status';

describe('canTransition - bảng chuyển trạng thái', () => {
  it('cho phép các bước tiến hợp lệ', () => {
    expect(canTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.SHIPPING)).toBe(true);
    expect(canTransition(OrderStatus.SHIPPING, OrderStatus.DELIVERED)).toBe(true);
    expect(canTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)).toBe(true);
  });

  it('không cho đi lùi, bỏ bước hoặc hủy đơn đang giao', () => {
    expect(canTransition(OrderStatus.DELIVERED, OrderStatus.PENDING)).toBe(false);
    expect(canTransition(OrderStatus.DELIVERED, OrderStatus.SHIPPING)).toBe(false);
    expect(canTransition(OrderStatus.SHIPPING, OrderStatus.CONFIRMED)).toBe(false);
    expect(canTransition(OrderStatus.PENDING, OrderStatus.DELIVERED)).toBe(false);
    expect(canTransition(OrderStatus.SHIPPING, OrderStatus.CANCELLED)).toBe(false);
  });

  it('trạng thái cuối (delivered, cancelled) không chuyển đi đâu được', () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.DELIVERED]).toEqual([]);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.CANCELLED]).toEqual([]);
    expect(canTransition(OrderStatus.PENDING, OrderStatus.PENDING)).toBe(false);
  });
});

describe('AdminOrdersService', () => {
  let service: AdminOrdersService;
  let manager: { findOne: jest.Mock; update: jest.Mock; increment: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let orderRepository: { findOne: jest.Mock; findAndCount: jest.Mock };
  let rolledBack: boolean;

  const phone = { product_id: 1, name: 'Galaxy S24' };
  const makeOrder = (status: OrderStatus, paymentStatus = PaymentStatus.PENDING) => ({
    order_id: 5,
    status,
    total_amount: '39980000.00',
    shipping_address: '12 Nguyen Trai',
    phone: '0987654321',
    created_at: new Date(),
    updated_at: new Date(),
    user: { user_id: 'u1', email: 'a@test.com', password_hash: 'khong-duoc-lo', profile: { full_name: 'Nguyen Van A' } },
    items: [{ order_item_id: 1, quantity: 2, price: '19990000.00', product: phone }],
    payments: [{ payment_id: 9, payment_method: PaymentMethod.COD, status: paymentStatus, amount: '39980000.00' }],
  });

  beforeEach(() => {
    rolledBack = false;
    manager = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      increment: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(async (callback) => {
        try {
          return await callback(manager);
        } catch (error) {
          rolledBack = true;
          throw error;
        }
      }),
    };
    orderRepository = { findOne: jest.fn(), findAndCount: jest.fn() };
    service = new AdminOrdersService(dataSource as any, orderRepository as any);
  });

  describe('updateStatus', () => {
    it('chuyển pending -> confirmed thành công và trả đơn kèm thông tin khách', async () => {
      manager.findOne.mockResolvedValue(makeOrder(OrderStatus.PENDING));
      orderRepository.findOne.mockResolvedValue(makeOrder(OrderStatus.CONFIRMED));

      const result = await service.updateStatus(5, OrderStatus.CONFIRMED);

      expect(manager.update).toHaveBeenCalledWith(
        Order,
        { order_id: 5, status: OrderStatus.PENDING },
        { status: OrderStatus.CONFIRMED },
      );
      expect(manager.increment).not.toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(result.customer).toEqual({ user_id: 'u1', email: 'a@test.com', full_name: 'Nguyen Van A' });
      expect(JSON.stringify(result)).not.toContain('khong-duoc-lo');
    });

    it('không cho đi lùi từ delivered (400) và không ghi gì vào DB', async () => {
      manager.findOne.mockResolvedValue(makeOrder(OrderStatus.DELIVERED, PaymentStatus.COMPLETED));

      await expect(service.updateStatus(5, OrderStatus.PENDING)).rejects.toThrow(BadRequestException);
      await expect(service.updateStatus(5, OrderStatus.CANCELLED)).rejects.toThrow(BadRequestException);
      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.increment).not.toHaveBeenCalled();
    });

    it('không cho bỏ bước: pending -> delivered', async () => {
      manager.findOne.mockResolvedValue(makeOrder(OrderStatus.PENDING));

      await expect(service.updateStatus(5, OrderStatus.DELIVERED)).rejects.toThrow(
        'Không thể chuyển đơn từ "Chờ xử lý" sang "Đã giao"',
      );
    });

    it('hủy đơn: hoàn lại tồn kho và đánh dấu thanh toán thất bại', async () => {
      manager.findOne.mockResolvedValue(makeOrder(OrderStatus.CONFIRMED));
      orderRepository.findOne.mockResolvedValue(makeOrder(OrderStatus.CANCELLED));

      await service.updateStatus(5, OrderStatus.CANCELLED);

      expect(manager.increment).toHaveBeenCalledWith(Product, { product_id: 1 }, 'stock', 2);
      expect(manager.update).toHaveBeenCalledWith(Payment, 9, { status: PaymentStatus.FAILED });
    });

    it('giao xong (delivered): thanh toán chuyển completed, không đụng tới tồn kho', async () => {
      manager.findOne.mockResolvedValue(makeOrder(OrderStatus.SHIPPING));
      orderRepository.findOne.mockResolvedValue(makeOrder(OrderStatus.DELIVERED, PaymentStatus.COMPLETED));

      await service.updateStatus(5, OrderStatus.DELIVERED);

      expect(manager.update).toHaveBeenCalledWith(Payment, 9, { status: PaymentStatus.COMPLETED });
      expect(manager.increment).not.toHaveBeenCalled();
    });

    it('báo lỗi 404 khi đơn không tồn tại', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, OrderStatus.CONFIRMED)).rejects.toThrow(NotFoundException);
    });

    it('báo lỗi 409 khi đơn vừa bị người khác đổi trạng thái (không cập nhật được dòng nào)', async () => {
      manager.findOne.mockResolvedValue(makeOrder(OrderStatus.PENDING));
      manager.update.mockResolvedValueOnce({ affected: 0 });

      await expect(service.updateStatus(5, OrderStatus.CONFIRMED)).rejects.toThrow(ConflictException);
      expect(rolledBack).toBe(true);
      expect(manager.increment).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('lọc theo trạng thái và phân trang', async () => {
      orderRepository.findAndCount.mockResolvedValue([[makeOrder(OrderStatus.PENDING)], 11]);

      const result = await service.findAll({ status: OrderStatus.PENDING, page: 2, limit: 5 });

      expect(orderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: OrderStatus.PENDING }, skip: 5, take: 5 }),
      );
      expect(result).toMatchObject({ total: 11, page: 2, limit: 5, totalPages: 3 });
      expect(result.items[0].customer.email).toBe('a@test.com');
    });

    it('không có status thì lấy mọi đơn', async () => {
      orderRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(orderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 0, take: 10 }),
      );
    });
  });
});
