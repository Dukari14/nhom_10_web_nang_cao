import 'dotenv/config';
import { User } from "../user/user.entity";
import { Products } from "../products/products.entity";
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 3306),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME ?? 'BanHang',
        entities: [User, Products],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];