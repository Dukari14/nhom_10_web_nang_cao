import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { OrderStatus } from '../../orders/order.entity';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';
import { toNumber, toText } from '../../common/transforms';

export class AdminOrdersQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus, description: 'Chỉ lấy đơn ở trạng thái này' })
  @IsOptional()
  @Transform(toText)
  @IsEnum(OrderStatus, { message: 'Trạng thái phải là pending, confirmed, shipping, delivered hoặc cancelled' })
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Trang, bắt đầu từ 1' })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10, maximum: 50, description: 'Số đơn mỗi trang' })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    description: 'pending → confirmed → shipping → delivered; hủy (cancelled) khi pending hoặc confirmed',
  })
  @IsEnum(OrderStatus, { message: 'Trạng thái phải là pending, confirmed, shipping, delivered hoặc cancelled' })
  status: OrderStatus;
}

export class AdminOrderCustomerDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Nguyễn Văn A', nullable: true })
  full_name: string | null;
}

export class AdminOrderResponseDto extends OrderResponseDto {
  @ApiProperty({ type: AdminOrderCustomerDto })
  customer: AdminOrderCustomerDto;
}

export class AdminOrderListResponseDto {
  @ApiProperty({ type: [AdminOrderResponseDto] })
  items: AdminOrderResponseDto[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
