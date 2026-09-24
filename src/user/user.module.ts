import { Module } from '@nestjs/common';
import { DatabaseModule } from "../database/database.module";
import { userProviders } from './user.provider';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [...userProviders, UserService],
})
export class UserModule {}