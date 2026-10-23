import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { CartItem } from '../cart/cart-item.entity';
import { OrderItem } from '../orders/order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  product_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Các trường riêng của điện thoại
  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ram: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  storage: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  // Mô tả cấu hình chi tiết (màn hình, chip, camera, pin...)
  @Column({ type: 'text', nullable: true })
  config_description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sale_price: string | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Không cho xóa danh mục khi còn sản phẩm
  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => CartItem, (item) => item.product)
  cart_items: CartItem[];

  @OneToMany(() => OrderItem, (item) => item.product)
  order_items: OrderItem[];
}
