import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { orderProviders } from './orders.provider';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [DatabaseModule, AuthModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [...orderProviders, OrdersService],
})
export class OrdersModule {}
