import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { cartProviders } from './cart.provider';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  // ProductsModule export PRODUCT_REPOSITORY để kiểm tra sản phẩm và tồn kho
  imports: [DatabaseModule, AuthModule, ProductsModule],
  controllers: [CartController],
  providers: [...cartProviders, CartService],
})
export class CartModule {}
