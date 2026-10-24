import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
  ],
})
export class AppModule {}
