import { Entity, Column, PrimaryColumn, VersionColumn } from 'typeorm';

@Entity('Products')
export class Products {
  @PrimaryColumn()
  prod_id: number;

  @Column()
  prod_name: string;

  @Column()
  prod_description: string;

  @Column()
  prod_price: number;

  @Column()
  prod_stock: number;

  @VersionColumn()
  prod_version: number;
}