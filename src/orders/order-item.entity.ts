import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  order_item_id: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // Giá tại thời điểm đặt hàng, không đổi khi sản phẩm đổi giá
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Không cho xóa sản phẩm khi còn trong đơn hàng
  @ManyToOne(() => Product, (product) => product.order_items, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
