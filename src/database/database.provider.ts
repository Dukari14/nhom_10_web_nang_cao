import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../user/user.entity';
import { UserProfile } from '../user/user-profile.entity';
import { Category } from '../categories/category.entity';
import { Product } from '../products/product.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Payment } from '../payments/payment.entity';

// Tách riêng để script seed dùng chung cấu hình kết nối với ứng dụng
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'banhang',
  entities: [
    User,
    UserProfile,
    Category,
    Product,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Payment,
  ],
  synchronize: true,
};

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => new DataSource(dataSourceOptions).initialize(),
  },
];
