import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { productProviders } from './products.provider';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  // AuthModule cung cấp JwtAuthGuard và RolesGuard cho các route của admin
  imports: [DatabaseModule, AuthModule, CategoriesModule],
  controllers: [ProductsController],
  providers: [...productProviders, ProductsService],
})
export class ProductsModule {}
