import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../order.entity';
import { PaymentMethod, PaymentStatus } from '../../payments/payment.entity';

export class OrderItemResponseDto {
  @ApiProperty({ example: 1 })
  order_item_id: number;

  @ApiProperty({ example: 1 })
  product_id: number;

  @ApiProperty({ example: 'Galaxy S24 256GB' })
  product_name: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 19990000, description: 'Đơn giá tại thời điểm đặt hàng' })
  price: number;

  @ApiProperty({ example: 39980000, description: 'price x quantity' })
  subtotal: number;
}

export class PaymentResponseDto {
  @ApiProperty({ example: 1 })
  payment_id: number;

  @ApiProperty({ enum: PaymentMethod })
  payment_method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ example: 39980000 })
  amount: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1024 })
  order_id: number;

  @ApiProperty({
    enum: OrderStatus,
    description: 'Trạng thái vận chuyển: pending, confirmed, shipping, delivered, cancelled',
  })
  status: OrderStatus;

  @ApiProperty({ example: 39980000, description: 'Tổng tiền, dạng số' })
  total_amount: number;

  @ApiProperty({ example: '12 Nguyễn Trãi, Hà Đông, Hà Nội' })
  shipping_address: string;

  @ApiProperty({ example: '0987654321' })
  phone: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ type: PaymentResponseDto, nullable: true })
  payment: PaymentResponseDto | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
