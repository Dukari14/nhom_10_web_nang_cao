import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

// Mọi trường đều tùy chọn, trường nào gửi lên thì được kiểm tra như khi tạo
export class UpdateProductDto extends PartialType(CreateProductDto) {}
