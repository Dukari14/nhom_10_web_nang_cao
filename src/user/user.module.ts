import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { userProviders } from './user.provider';

@Module({
  imports: [DatabaseModule],
  providers: [...userProviders],
  exports: [...userProviders],
})
export class UserModule {}
