import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../products/product.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  cart_item_id: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  // Không cho xóa sản phẩm khi còn trong giỏ
  @ManyToOne(() => Product, (product) => product.cart_items, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
