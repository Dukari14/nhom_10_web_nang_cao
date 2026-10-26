import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

const MAX_QUANTITY = 100;

export class AddCartItemDto {
  @ApiProperty({ example: 1, description: 'Mã sản phẩm (product_id)' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: MAX_QUANTITY })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải từ 1 trở lên' })
  @Max(MAX_QUANTITY)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: MAX_QUANTITY })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải từ 1 trở lên' })
  @Max(MAX_QUANTITY)
  quantity: number;
}
