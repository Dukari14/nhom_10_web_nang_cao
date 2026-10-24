import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PaymentMethod } from '../../payments/payment.entity';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateOrderDto {
  @ApiProperty({ example: '12 Nguyễn Trãi, Hà Đông, Hà Nội' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  @MinLength(5, { message: 'Địa chỉ giao hàng quá ngắn' })
  @MaxLength(255)
  shipping_address: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại Việt Nam, 10 số hoặc +84' })
  @Transform(trim)
  @Matches(/^(0|\+84)\d{9}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD, description: 'COD: thanh toán khi nhận hàng, BANK_TRANSFER: chuyển khoản' })
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán phải là COD hoặc BANK_TRANSFER' })
  payment_method: PaymentMethod;
}
