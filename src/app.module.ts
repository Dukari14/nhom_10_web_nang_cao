import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [AuthModule, CategoriesModule, ProductsModule],
})
export class AppModule {}
