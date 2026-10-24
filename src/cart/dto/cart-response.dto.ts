import { ApiProperty } from '@nestjs/swagger';

export class CartProductDto {
  @ApiProperty({ example: 1 })
  product_id: number;

  @ApiProperty({ example: 'Galaxy S24 256GB' })
  name: string;

  @ApiProperty({ example: 'Samsung', nullable: true })
  brand: string | null;

  @ApiProperty({ example: '8GB', nullable: true })
  ram: string | null;

  @ApiProperty({ example: '256GB', nullable: true })
  storage: string | null;

  @ApiProperty({ example: 'Đen', nullable: true })
  color: string | null;

  @ApiProperty({ example: 'galaxy-s24-256gb-den' })
  slug: string;

  @ApiProperty({ nullable: true })
  image_url: string | null;

  @ApiProperty({ example: 12, description: 'Tồn kho hiện tại' })
  stock: number;
}

export class CartItemResponseDto {
  @ApiProperty({ example: 5 })
  cart_item_id: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 19990000, description: 'Đơn giá: giá khuyến mãi nếu có, không thì giá gốc' })
  unit_price: number;

  @ApiProperty({ example: 39980000, description: 'unit_price x quantity' })
  line_total: number;

  @ApiProperty({ type: CartProductDto })
  product: CartProductDto;
}

export class CartResponseDto {
  @ApiProperty({ example: 3, nullable: true, description: 'null nếu người dùng chưa có giỏ hàng' })
  cart_id: number | null;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ example: 2, description: 'Tổng số lượng máy trong giỏ' })
  total_quantity: number;

  @ApiProperty({ example: 39980000, description: 'Tổng tiền, dạng số' })
  total_amount: number;
}
