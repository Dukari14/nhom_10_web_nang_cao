import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../src/orders/orders.service';
import { PaymentsService } from '../src/payments/payments.service';
import { Order, OrderStatus } from '../src/orders/order.entity';
import { OrderItem } from '../src/orders/order-item.entity';
import { CartItem } from '../src/cart/cart-item.entity';
import { PaymentMethod, PaymentStatus } from '../src/payments/payment.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let manager: { findOne: jest.Mock; update: jest.Mock; save: jest.Mock; delete: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let orderRepository: { find: jest.Mock; findOne: jest.Mock };
  let committed: boolean;
  let rolledBack: boolean;

  const dto = { shipping_address: '12 Nguyễn Trãi, Hà Nội', phone: '0987654321', payment_method: PaymentMethod.COD };
  const phoneA = { product_id: 1, name: 'Galaxy S24', price: '22990000.00', sale_price: '19990000.00', stock: 5 };
  const phoneB = { product_id: 2, name: 'Redmi 13C', price: '3290000.00', sale_price: null, stock: 10 };
  const cartWithTwoItems = {
    cart_id: 7,
    items: [
      { cart_item_id: 11, quantity: 2, product: phoneA },
      { cart_item_id: 12, quantity: 1, product: phoneB },
    ],
  };

  // Đơn đã lưu trong DB, dùng cho bước đọc lại sau khi tạo
  const savedOrder = () => ({
    order_id: 100,
    status: OrderStatus.PENDING,
    total_amount: '43270000.00',
    shipping_address: dto.shipping_address,
    phone: dto.phone,
    created_at: new Date(),
    updated_at: new Date(),
    user: { user_id: 'u1', password_hash: 'khong-duoc-lo' },
    items: [
      { order_item_id: 1, quantity: 2, price: '19990000.00', product: phoneA },
      { order_item_id: 2, quantity: 1, price: '3290000.00', product: phoneB },
    ],
    payments: [{ payment_id: 1, payment_method: PaymentMethod.COD, status: PaymentStatus.PENDING, amount: '43270000.00' }],
  });

  beforeEach(() => {
    committed = false;
    rolledBack = false;
    manager = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn(async (_entity, data) => (Array.isArray(data) ? data : { order_id: 100, ...data })),
      delete: jest.fn(),
    };
    // Giả lập transaction của TypeORM: callback lỗi thì "rollback", thành công thì "commit"
    dataSource = {
      transaction: jest.fn(async (callback) => {
        try {
          const result = await callback(manager);
          committed = true;
          return result;
        } catch (error) {
          rolledBack = true;
          throw error;
        }
      }),
    };
    orderRepository = { find: jest.fn(), findOne: jest.fn() };
    service = new OrdersService(dataSource as any, orderRepository as any, new PaymentsService());
  });

  describe('create - đặt hàng thành công', () => {
    beforeEach(() => {
      manager.findOne.mockResolvedValue(cartWithTwoItems);
      orderRepository.findOne.mockResolvedValue(savedOrder());
    });

    it('trừ kho, lưu giá tại thời điểm đặt, ghi thanh toán, xóa giỏ và commit', async () => {
      const result = await service.create('u1', dto);

      // Trừ kho từng sản phẩm
      expect(manager.update).toHaveBeenCalledTimes(2);
      // Đơn: tổng 2 x 19.990.000 + 1 x 3.290.000 = 43.270.000
      expect(manager.save).toHaveBeenCalledWith(
        Order,
        expect.objectContaining({ total_amount: '43270000.00', status: OrderStatus.PENDING, phone: dto.phone }),
      );
      // Giá từng dòng được chụp lại: sản phẩm A lấy giá khuyến mãi, B lấy giá gốc
      const orderItemCall = manager.save.mock.calls.find((call) => call[0] === OrderItem);
      expect(orderItemCall?.[1].map((i: any) => i.price)).toEqual(['19990000.00', '3290000.00']);
      // Thanh toán gắn với đơn, bắt đầu ở trạng thái pending
      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ amount: '43270000.00', payment_method: PaymentMethod.COD, status: PaymentStatus.PENDING }),
      );
      // Xóa đúng các dòng giỏ hàng
      expect(manager.delete).toHaveBeenCalledWith(CartItem, [11, 12]);
      expect(committed).toBe(true);
      expect(rolledBack).toBe(false);

      // Response: tiền là số, không lộ dữ liệu user
      expect(result.total_amount).toBe(43270000);
      expect(typeof result.total_amount).toBe('number');
      expect(result.items[0]).toMatchObject({ price: 19990000, subtotal: 39980000 });
      expect(result.payment).toMatchObject({ payment_method: 'COD', status: 'pending', amount: 43270000 });
      expect(JSON.stringify(result)).not.toContain('khong-duoc-lo');
    });

    it('hỗ trợ thanh toán chuyển khoản', async () => {
      await service.create('u1', { ...dto, payment_method: PaymentMethod.BANK_TRANSFER });

      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ payment_method: PaymentMethod.BANK_TRANSFER }),
      );
    });
  });

  describe('create - đơn giá trị lớn', () => {
    const flagship = { product_id: 7, name: 'iPhone 15 Pro Max 256GB', price: '34990000.00', sale_price: null, stock: 50 };

    it('đơn trên 100 triệu vẫn đặt được và lưu đúng tổng tiền', async () => {
      // 5 máy x 34.990.000đ = 174.950.000đ, vượt giới hạn cũ của DECIMAL(10,2)
      manager.findOne.mockResolvedValue({ cart_id: 7, items: [{ cart_item_id: 11, quantity: 5, product: flagship }] });
      orderRepository.findOne.mockResolvedValue({
        ...savedOrder(),
        total_amount: '174950000.00',
        items: [{ order_item_id: 1, quantity: 5, price: '34990000.00', product: flagship }],
        payments: [{ payment_id: 1, payment_method: PaymentMethod.COD, status: PaymentStatus.PENDING, amount: '174950000.00' }],
      });

      const result = await service.create('u1', dto);

      expect(manager.save).toHaveBeenCalledWith(Order, expect.objectContaining({ total_amount: '174950000.00' }));
      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ amount: '174950000.00' }),
      );
      expect(result.total_amount).toBe(174950000);
      expect(result.payment?.amount).toBe(174950000);
      expect(committed).toBe(true);
    });

    it('vượt giới hạn cột tiền thì báo lỗi 400 tiếng Việt, không trừ kho, không tạo đơn', async () => {
      // Mỗi dòng tối đa 100 máy x 99.999.999,99đ (giới hạn của DTO), nên cần 101 dòng
      // mới vượt 999.999.999.999đ: 101 x 100 x 99.999.999,99đ ≈ 1.010 tỷ đồng
      const items = Array.from({ length: 101 }, (_, index) => ({
        cart_item_id: index + 1,
        quantity: 100,
        product: { product_id: 100 + index, name: 'Máy thử giới hạn', price: '99999999.99', sale_price: null, stock: 500 },
      }));
      manager.findOne.mockResolvedValue({ cart_id: 7, items });
      const error = await service.create('u1', dto).catch((e) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toContain('Tổng giá trị đơn hàng vượt quá giới hạn cho phép (999.999.999.999đ)');
      expect(error.message).toContain('chia thành nhiều đơn');
      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.delete).not.toHaveBeenCalled();
      expect(rolledBack).toBe(true);
    });
  });

  describe('create - giỏ hàng trống', () => {
    it('báo lỗi 400 khi chưa có giỏ hàng', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.create('u1', dto)).rejects.toThrow(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('báo lỗi 400 khi giỏ hàng không có dòng nào', async () => {
      manager.findOne.mockResolvedValue({ cart_id: 7, items: [] });

      await expect(service.create('u1', dto)).rejects.toThrow(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('create - rollback khi lỗi', () => {
    it('hết hàng ở sản phẩm thứ hai thì rollback, không tạo đơn, không xóa giỏ', async () => {
      manager.findOne.mockResolvedValue(cartWithTwoItems);
      manager.update
        .mockResolvedValueOnce({ affected: 1 }) // sản phẩm A trừ kho được
        .mockResolvedValueOnce({ affected: 0 }); // sản phẩm B không còn đủ hàng

      await expect(service.create('u1', dto)).rejects.toThrow(BadRequestException);

      expect(rolledBack).toBe(true);
      expect(committed).toBe(false);
      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.delete).not.toHaveBeenCalled();
    });

    it('lỗi khi ghi thanh toán thì rollback, giỏ hàng không bị xóa', async () => {
      manager.findOne.mockResolvedValue(cartWithTwoItems);
      manager.save.mockImplementation(async (entity, data) => {
        if (entity !== Order && entity !== OrderItem) throw new Error('Mất kết nối database');
        return Array.isArray(data) ? data : { order_id: 100, ...data };
      });

      await expect(service.create('u1', dto)).rejects.toThrow('Mất kết nối database');

      expect(rolledBack).toBe(true);
      expect(committed).toBe(false);
      expect(manager.delete).not.toHaveBeenCalled();
    });
  });

  describe('findOne - quyền truy cập', () => {
    it('chủ đơn xem được chi tiết và trạng thái vận chuyển', async () => {
      orderRepository.findOne.mockResolvedValue(savedOrder());

      await expect(service.findOne('u1', 100)).resolves.toMatchObject({ order_id: 100, status: 'pending' });
    });

    it('báo lỗi 403 khi xem đơn của người khác', async () => {
      orderRepository.findOne.mockResolvedValue(savedOrder());

      await expect(service.findOne('u2', 100)).rejects.toThrow(ForbiddenException);
    });

    it('báo lỗi 404 khi đơn không tồn tại', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('u1', 999)).rejects.toThrow(NotFoundException);
    });
  });
});
