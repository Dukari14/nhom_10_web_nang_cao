import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService, slugify } from '../src/products/products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let qb: Record<string, jest.Mock>;
  let productRepository: Record<string, jest.Mock>;
  let categoryRepository: { findOneBy: jest.Mock };

  const category = { category_id: 1, name: 'Điện thoại Samsung', slug: 'dien-thoai-samsung' };
  const samsungS24 = { product_id: 1, name: 'Galaxy S24 256GB', brand: 'Samsung', slug: 'galaxy-s24-256gb' };

  beforeEach(() => {
    // Giả lập QueryBuilder: mỗi hàm trả lại chính nó để gọi nối tiếp được
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[samsungS24], 1]),
    };
    productRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ product_id: 99, ...data })),
      remove: jest.fn(),
    };
    categoryRepository = { findOneBy: jest.fn() };
    service = new ProductsService(productRepository as any, categoryRepository as any);
  });

  describe('findAll - tìm kiếm', () => {
    it('tìm theo tên hoặc thương hiệu bằng LIKE có tham số hóa', async () => {
      const result = await service.findAll({ search: 'samsung' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(p.name LIKE :keyword OR p.brand LIKE :keyword)',
        { keyword: '%samsung%' },
      );
      expect(result.items).toEqual([samsungS24]);
      expect(result.total).toBe(1);
    });

    it('thoát ký tự đặc biệt của LIKE và không nối chuỗi người dùng vào SQL', async () => {
      const attack = "100%_'; DROP TABLE products; --";

      await service.findAll({ search: attack });

      const [sql, params] = qb.andWhere.mock.calls[0];
      expect(sql).not.toContain('DROP TABLE');
      expect(params.keyword).toBe("%100\\%\\_'; DROP TABLE products; --%");
    });
  });

  describe('findAll - dành cho admin', () => {
    it('admin thấy cả sản phẩm đang ẩn và có kèm danh mục', async () => {
      qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);

      await service.findAll({ search: 'samsung' }, true);

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('p.category', 'c');
      expect(qb.where).not.toHaveBeenCalledWith('p.is_active = :active', expect.anything());
    });

    it('khách chỉ thấy sản phẩm đang bán', async () => {
      await service.findAll({});

      expect(qb.where).toHaveBeenCalledWith('p.is_active = :active', { active: true });
    });
  });

  describe('findAll - lọc và phân trang', () => {
    it('lọc theo khoảng giá, dung lượng và màu sắc', async () => {
      await service.findAll({ minPrice: 5000000, maxPrice: 20000000, storage: '256GB', color: 'Đen' });

      expect(qb.andWhere).toHaveBeenCalledWith('COALESCE(p.sale_price, p.price) >= :minPrice', { minPrice: 5000000 });
      expect(qb.andWhere).toHaveBeenCalledWith('COALESCE(p.sale_price, p.price) <= :maxPrice', { maxPrice: 20000000 });
      expect(qb.andWhere).toHaveBeenCalledWith('p.storage = :storage', { storage: '256GB' });
      expect(qb.andWhere).toHaveBeenCalledWith('p.color = :color', { color: 'Đen' });
    });

    it('phân trang đúng: trang 3, mỗi trang 5 sản phẩm', async () => {
      qb.getManyAndCount.mockResolvedValue([[samsungS24], 11]);

      const result = await service.findAll({ page: 3, limit: 5 });

      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result).toMatchObject({ page: 3, limit: 5, total: 11, totalPages: 3 });
    });

    it('báo lỗi 400 khi minPrice lớn hơn maxPrice', async () => {
      await expect(service.findAll({ minPrice: 10, maxPrice: 5 })).rejects.toThrow(BadRequestException);
      expect(productRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('trả danh sách rỗng khi không có sản phẩm khớp', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ search: 'khong-co-may-nay' });

      expect(result).toMatchObject({ items: [], total: 0, totalPages: 0 });
    });
  });

  describe('findOne - không tìm thấy', () => {
    it('trả chi tiết khi có sản phẩm', async () => {
      productRepository.findOne.mockResolvedValue({ ...samsungS24, category });

      await expect(service.findOne(1)).resolves.toMatchObject({ product_id: 1 });
    });

    it('báo lỗi 404 khi không có sản phẩm', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { category_id: 1, name: 'Galaxy S24 256GB', price: 22990000, sale_price: 19990000, stock: 5 };

    it('tạo sản phẩm, tự sinh slug và gắn danh mục', async () => {
      categoryRepository.findOneBy.mockResolvedValue(category);
      productRepository.findOneBy.mockResolvedValue(null);
      productRepository.findOne.mockResolvedValue({ ...samsungS24, product_id: 99 });

      const result = await service.create(dto);

      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'galaxy-s24-256gb',
          price: '22990000',
          sale_price: '19990000',
          category,
        }),
      );
      expect(productRepository.save).toHaveBeenCalled();
      expect(result.product_id).toBe(99);
    });

    it('báo lỗi 400 khi danh mục không tồn tại', async () => {
      categoryRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(productRepository.save).not.toHaveBeenCalled();
    });

    it('báo lỗi 400 khi giá khuyến mãi lớn hơn giá gốc', async () => {
      categoryRepository.findOneBy.mockResolvedValue(category);

      await expect(service.create({ ...dto, sale_price: 30000000 })).rejects.toThrow(BadRequestException);
    });

    it('báo lỗi 409 khi slug đã tồn tại', async () => {
      categoryRepository.findOneBy.mockResolvedValue(category);
      productRepository.findOneBy.mockResolvedValue(samsungS24);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('xóa sản phẩm tồn tại', async () => {
      productRepository.findOne.mockResolvedValue(samsungS24);
      productRepository.remove.mockResolvedValue(samsungS24);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(productRepository.remove).toHaveBeenCalledWith(samsungS24);
    });

    it('báo lỗi 404 khi xóa sản phẩm không tồn tại', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(productRepository.remove).not.toHaveBeenCalled();
    });

    it('báo lỗi 409 khi sản phẩm còn nằm trong giỏ hàng hoặc đơn hàng', async () => {
      productRepository.findOne.mockResolvedValue(samsungS24);
      productRepository.remove.mockRejectedValue({ driverError: { code: 'ER_ROW_IS_REFERENCED_2' } });

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });

  describe('slugify', () => {
    it('bỏ dấu tiếng Việt và thay khoảng trắng bằng gạch ngang', () => {
      expect(slugify('Điện thoại Samsung S24')).toBe('dien-thoai-samsung-s24');
    });
  });
});
