import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CartService } from '../src/cart/cart.service';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: Record<string, jest.Mock>;
  let cartItemRepository: Record<string, jest.Mock>;
  let productRepository: { findOneBy: jest.Mock };

  // Giá lưu dạng chuỗi như cột DECIMAL của MySQL
  const phoneA = { product_id: 1, name: 'Galaxy S24', slug: 'galaxy-s24', image_url: null, price: '22990000.00', sale_price: '19990000.00', stock: 5, is_active: true };
  const phoneB = { product_id: 2, name: 'Redmi 13C', slug: 'redmi-13c', image_url: null, price: '3290000.00', sale_price: null, stock: 10, is_active: true };

  beforeEach(() => {
    cartRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ cart_id: 7, ...data })),
    };
    cartItemRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => data),
      remove: jest.fn(),
    };
    productRepository = { findOneBy: jest.fn() };
    service = new CartService(cartRepository as any, cartItemRepository as any, productRepository as any);
  });

  describe('addItem', () => {
    it('báo lỗi 400 khi số lượng thêm vượt tồn kho', async () => {
      productRepository.findOneBy.mockResolvedValue(phoneA);
      cartRepository.findOne.mockResolvedValue({ cart_id: 7, items: [] });

      await expect(service.addItem('u1', { productId: 1, quantity: 6 })).rejects.toThrow(BadRequestException);
      expect(cartItemRepository.save).not.toHaveBeenCalled();
    });

    it('báo lỗi 400 khi cộng dồn với số lượng đã có trong giỏ vượt tồn kho', async () => {
      productRepository.findOneBy.mockResolvedValue(phoneA);
      cartRepository.findOne.mockResolvedValue({
        cart_id: 7,
        items: [{ cart_item_id: 1, quantity: 4, product: phoneA }],
      });

      await expect(service.addItem('u1', { productId: 1, quantity: 2 })).rejects.toThrow(BadRequestException);
    });

    it('báo lỗi 404 khi sản phẩm không tồn tại', async () => {
      productRepository.findOneBy.mockResolvedValue(null);

      await expect(service.addItem('u1', { productId: 99, quantity: 1 })).rejects.toThrow(NotFoundException);
    });

    it('thêm thành công, tạo giỏ mới khi chưa có và trả tổng tiền dạng số', async () => {
      productRepository.findOneBy.mockResolvedValue(phoneA);
      // lần 1: chưa có giỏ; lần 2 (đọc lại sau khi thêm): giỏ có 1 dòng
      cartRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ cart_id: 7, items: [{ cart_item_id: 1, quantity: 2, product: phoneA }] });

      const cart = await service.addItem('u1', { productId: 1, quantity: 2 });

      expect(cartRepository.save).toHaveBeenCalled();
      expect(cartItemRepository.save).toHaveBeenCalledWith(expect.objectContaining({ quantity: 2 }));
      expect(cart.total_amount).toBe(39980000);
      expect(typeof cart.total_amount).toBe('number');
    });
  });

  describe('getCart - tính tiền', () => {
    it('dùng giá khuyến mãi nếu có, không thì giá gốc, cộng chính xác', async () => {
      const cheap = { ...phoneB, product_id: 3, price: '0.10', sale_price: null };
      cartRepository.findOne.mockResolvedValue({
        cart_id: 7,
        items: [
          { cart_item_id: 1, quantity: 2, product: phoneA },
          { cart_item_id: 2, quantity: 3, product: phoneB },
          { cart_item_id: 3, quantity: 3, product: cheap },
        ],
      });

      const cart = await service.getCart('u1');

      expect(cart.items[0]).toMatchObject({ unit_price: 19990000, line_total: 39980000 });
      expect(cart.items[1]).toMatchObject({ unit_price: 3290000, line_total: 9870000 });
      // 0.10 x 3 = 0.3 chứ không phải 0.30000000000000004
      expect(cart.items[2].line_total).toBe(0.3);
      expect(cart.total_amount).toBe(49850000.3);
      expect(cart.total_quantity).toBe(8);
    });

    it('trả giỏ rỗng khi người dùng chưa có giỏ', async () => {
      cartRepository.findOne.mockResolvedValue(null);

      await expect(service.getCart('u1')).resolves.toEqual({
        cart_id: null,
        items: [],
        total_quantity: 0,
        total_amount: 0,
      });
    });
  });

  describe('updateItem / removeItem', () => {
    const ownedItem = () => ({
      cart_item_id: 5,
      quantity: 1,
      product: phoneA,
      cart: { cart_id: 7, user: { user_id: 'u1' } },
    });

    it('báo lỗi 400 khi đổi số lượng vượt tồn kho', async () => {
      cartItemRepository.findOne.mockResolvedValue(ownedItem());

      await expect(service.updateItem('u1', 5, { quantity: 6 })).rejects.toThrow(BadRequestException);
      expect(cartItemRepository.save).not.toHaveBeenCalled();
    });

    it('đổi số lượng thành công', async () => {
      cartItemRepository.findOne.mockResolvedValue(ownedItem());
      cartRepository.findOne.mockResolvedValue({ cart_id: 7, items: [] });

      await service.updateItem('u1', 5, { quantity: 3 });

      expect(cartItemRepository.save).toHaveBeenCalledWith(expect.objectContaining({ quantity: 3 }));
    });

    it('báo lỗi 403 khi sửa hoặc xóa dòng giỏ của người khác', async () => {
      cartItemRepository.findOne.mockResolvedValue(ownedItem());

      await expect(service.updateItem('u2', 5, { quantity: 2 })).rejects.toThrow(ForbiddenException);
      await expect(service.removeItem('u2', 5)).rejects.toThrow(ForbiddenException);
      expect(cartItemRepository.remove).not.toHaveBeenCalled();
    });

    it('báo lỗi 404 khi dòng giỏ không tồn tại', async () => {
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(service.removeItem('u1', 999)).rejects.toThrow(NotFoundException);
    });
  });
});
