import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

// Các lớp dưới đây chỉ dùng để mô tả response trên Swagger
export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  product_id: number;

  @ApiProperty({ example: 'Samsung Galaxy S24 256GB' })
  name: string;

  @ApiProperty({ example: 'samsung-galaxy-s24-256gb' })
  slug: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 'Samsung', nullable: true })
  brand: string | null;

  @ApiProperty({ example: '8GB', nullable: true })
  ram: string | null;

  @ApiProperty({ example: '256GB', nullable: true })
  storage: string | null;

  @ApiProperty({ example: 'Đen', nullable: true })
  color: string | null;

  @ApiProperty({ example: 'Màn hình 6.2 inch; Chip Exynos 2400', nullable: true })
  config_description: string | null;

  @ApiProperty({ example: '22990000.00' })
  price: string;

  @ApiProperty({ example: '19990000.00', nullable: true })
  sale_price: string | null;

  @ApiProperty({ example: 12 })
  stock: number;

  @ApiProperty({ nullable: true })
  image_url: string | null;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class ProductDetailResponseDto extends ProductResponseDto {
  @ApiProperty({ type: CategoryResponseDto })
  category: CategoryResponseDto;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  items: ProductResponseDto[];

  @ApiProperty({ example: 20, description: 'Tổng số sản phẩm khớp điều kiện (chưa phân trang)' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;
}
