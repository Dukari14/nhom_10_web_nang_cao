import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { categoryProviders } from './categories.provider';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoriesController],
  providers: [...categoryProviders, CategoriesService],
  exports: [...categoryProviders],
})
export class CategoriesModule {}
