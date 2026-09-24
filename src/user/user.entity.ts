import { Entity, Column, PrimaryColumn, VersionColumn } from 'typeorm';

@Entity('User')
export class User {
  @PrimaryColumn()
  user_id: number;

  @Column()
  user_name: string;

  @Column()
  user_email: string;

  @Column()
  user_phone: string;

  @Column()
  user_address: string;

  @Column()
  user_password: string;

  @Column()
  user_role: string;

  @VersionColumn()
  user_version: number;
}