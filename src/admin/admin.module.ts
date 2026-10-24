import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ProductsModule } from '../products/products.module';
import { orderProviders } from '../orders/orders.provider';
import { adminProviders } from './admin.provider';
import { AdminOrdersService } from './admin-orders.service';
import { AdminUsersService } from './admin-users.service';
import { AdminStatsService } from './admin-stats.service';
import {
  AdminOrdersController,
  AdminProductsController,
  AdminStatsController,
  AdminUsersController,
} from './admin.controller';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule, ProductsModule],
  controllers: [AdminOrdersController, AdminUsersController, AdminProductsController, AdminStatsController],
  providers: [
    ...orderProviders,
    ...adminProviders,
    AdminOrdersService,
    AdminUsersService,
    AdminStatsService,
  ],
})
export class AdminModule {}
