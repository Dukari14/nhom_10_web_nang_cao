import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Cart } from '../cart/cart.entity';
import { Order } from '../orders/order.entity';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  // Chỉ lưu mật khẩu đã băm bằng bcrypt
  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // cascade để lưu user và profile trong cùng một lần save
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
