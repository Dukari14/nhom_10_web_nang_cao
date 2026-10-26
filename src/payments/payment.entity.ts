import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,} from 'typeorm';
import { Order } from '../orders/order.entity';

export enum PaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  // COD: thanh toán khi nhận hàng, BANK_TRANSFER: chuyển khoản
  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  payment_method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Order, (order) => order.payments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
