import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';
import { centsToDecimal } from '../common/money';

@Injectable()
export class PaymentsService {
  // Ghi nhận thanh toán của đơn hàng. Nhận EntityManager của transaction đặt hàng
  // để bản ghi payment được lưu hoặc hủy cùng với đơn.
  // Cả COD và chuyển khoản đều bắt đầu ở trạng thái pending.
  async record(
    manager: EntityManager,
    order: Order,
    method: PaymentMethod,
    amountCents: number,
  ): Promise<Payment> {
    return manager.save(Payment, {
      order,
      amount: centsToDecimal(amountCents),
      payment_method: method,
      status: PaymentStatus.PENDING,
    });
  }
}
