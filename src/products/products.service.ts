import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../categories/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';

export const DEFAULT_LATEST_LIMIT = 8;
export const DEFAULT_PAGE_SIZE = 12;

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Đổi "Điện thoại Samsung S24" thành "dien-thoai-samsung-s24"
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Thoát các ký tự đặc biệt của LIKE để "100%" chỉ khớp đúng chuỗi "100%"
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&');
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepository: Repository<Product>,
    @Inject('CATEGORY_REPOSITORY')
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // 1. Điện thoại mới nhất (trang chủ)
  async findLatest(limit: number = DEFAULT_LATEST_LIMIT): Promise<Product[]> {
    return this.productRepository.find({
      where: { is_active: true },
      order: { created_at: 'DESC', product_id: 'DESC' },
      take: limit,
    });
  }

  // 2. Tìm kiếm, lọc và phân trang
  async findAll(query: ListProductsQueryDto): Promise<ProductListResult> {
    const { search, brand, minPrice, maxPrice, storage, color } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new BadRequestException('minPrice không được lớn hơn maxPrice');
    }

    // Mọi giá trị từ người dùng đều đi qua tham số (:name), không nối chuỗi vào SQL
    const qb = this.productRepository
      .createQueryBuilder('p')
      .where('p.is_active = :active', { active: true });

    if (search) {
      qb.andWhere('(p.name LIKE :keyword OR p.brand LIKE :keyword)', {
        keyword: `%${escapeLike(search)}%`,
      });
    }
    if (brand) {
      qb.andWhere('p.brand = :brand', { brand });
    }
    // Lọc theo giá thực tế khách phải trả: giá khuyến mãi nếu có, không thì giá gốc
    if (minPrice !== undefined) {
      qb.andWhere('COALESCE(p.sale_price, p.price) >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('COALESCE(p.sale_price, p.price) <= :maxPrice', { maxPrice });
    }
    if (storage) {
      qb.andWhere('p.storage = :storage', { storage });
    }
    if (color) {
      qb.andWhere('p.color = :color', { color });
    }

    const [items, total] = await qb
      .orderBy('p.created_at', 'DESC')
      .addOrderBy('p.product_id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // 3. Chi tiết một sản phẩm đang bán
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id: id, is_active: true },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID = ${id}`);
    }
    return product;
  }

  // 4. Tạo sản phẩm mới (admin)
  async create(dto: CreateProductDto): Promise<Product> {
    const { category_id, price, sale_price, ...rest } = dto;

    const category = await this.categoryRepository.findOneBy({ category_id });
    if (!category) {
      throw new BadRequestException(`Danh mục có ID = ${category_id} không tồn tại`);
    }
    this.assertSalePrice(price, sale_price);

    const slug = dto.slug ?? slugify(dto.name);
    if (!slug) {
      throw new BadRequestException('Không tạo được slug từ tên sản phẩm');
    }
    await this.assertSlugFree(slug);

    const product = this.productRepository.create({
      ...rest,
      slug,
      price: String(price),
      sale_price: sale_price == null ? null : String(sale_price),
      category,
    });
    const saved = await this.productRepository.save(product);
    // Đọc lại để giá trả về cùng định dạng với các API khác
    return this.findById(saved.product_id);
  }

  // 5. Cập nhật sản phẩm (admin), chỉ đổi các trường được gửi lên
  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    const { category_id, price, sale_price, ...rest } = dto;

    if (category_id !== undefined) {
      const category = await this.categoryRepository.findOneBy({ category_id });
      if (!category) {
        throw new BadRequestException(`Danh mục có ID = ${category_id} không tồn tại`);
      }
      product.category = category;
    }
    if (rest.slug && rest.slug !== product.slug) {
      await this.assertSlugFree(rest.slug);
    }

    Object.assign(product, rest);
    if (price !== undefined) product.price = String(price);
    if (sale_price !== undefined) product.sale_price = sale_price === null ? null : String(sale_price);
    this.assertSalePrice(product.price, product.sale_price);

    await this.productRepository.save(product);
    return this.findById(id);
  }

  // 6. Xóa sản phẩm (admin)
  async remove(id: number): Promise<void> {
    const product = await this.findById(id);
    try {
      await this.productRepository.remove(product);
    } catch (error) {
      // Khóa ngoại RESTRICT: sản phẩm còn nằm trong giỏ hàng hoặc đơn hàng
      if (this.isForeignKeyError(error)) {
        throw new ConflictException(
          'Sản phẩm đã có trong giỏ hàng hoặc đơn hàng, không thể xóa. Hãy ẩn sản phẩm bằng is_active = false',
        );
      }
      throw error;
    }
  }

  // Tìm theo ID kể cả sản phẩm đang ẩn, dùng cho các thao tác của admin
  private async findById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id: id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID = ${id}`);
    }
    return product;
  }

  private async assertSlugFree(slug: string): Promise<void> {
    const existed = await this.productRepository.findOneBy({ slug });
    if (existed) {
      throw new ConflictException(`Slug "${slug}" đã được sử dụng`);
    }
  }

  private assertSalePrice(price: number | string, salePrice?: number | string | null): void {
    if (salePrice != null && Number(salePrice) > Number(price)) {
      throw new BadRequestException('Giá khuyến mãi không được lớn hơn giá gốc');
    }
  }

  private isForeignKeyError(error: unknown): boolean {
    const e = error as { code?: string; driverError?: { code?: string } };
    return (e?.driverError?.code ?? e?.code) === 'ER_ROW_IS_REFERENCED_2';
  }
}
