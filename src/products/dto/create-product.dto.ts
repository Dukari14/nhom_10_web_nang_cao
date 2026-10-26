import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Cột DECIMAL(10,2) chứa tối đa 99.999.999,99
const MAX_PRICE = 99_999_999.99;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateProductDto {
  @ApiProperty({ example: 1, description: 'Mã danh mục (category_id)' })
  @IsInt()
  @Min(1)
  category_id: number;

  @ApiProperty({ example: 'Samsung Galaxy S24 256GB' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'samsung-galaxy-s24-256gb', description: 'Bỏ trống thì tự sinh từ tên' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug?: string;

  @ApiPropertyOptional({ example: 'Flagship nhỏ gọn của Samsung' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Samsung' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: '8GB' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  ram?: string;

  @ApiPropertyOptional({ example: '256GB' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  storage?: string;

  @ApiPropertyOptional({ example: 'Đen' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 'Màn hình 6.2 inch; Chip Exynos 2400; Pin 4000 mAh' })
  @IsOptional()
  @IsString()
  config_description?: string;

  @ApiProperty({ example: 22990000, description: 'Giá gốc, phải lớn hơn 0' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Giá phải lớn hơn 0' })
  @Max(MAX_PRICE)
  price: number;

  @ApiPropertyOptional({ example: 19990000, nullable: true, description: 'Giá khuyến mãi, lớn hơn 0 và không vượt giá gốc' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Giá khuyến mãi phải lớn hơn 0' })
  @Max(MAX_PRICE)
  sale_price?: number | null;

  @ApiPropertyOptional({ example: 12, default: 0, description: 'Tồn kho, không âm' })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Tồn kho không được âm' })
  stock?: number;

  @ApiPropertyOptional({ example: 'https://example.com/s24.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
