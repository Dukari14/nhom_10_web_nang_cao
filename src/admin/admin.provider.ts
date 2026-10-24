import { DataSource } from 'typeorm';
import { OrderItem } from '../orders/order-item.entity';

export const adminProviders = [
  {
    provide: 'ORDER_ITEM_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(OrderItem),
    inject: ['DATA_SOURCE'],
  },
];
