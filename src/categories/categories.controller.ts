import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // GET /api/categories
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách danh mục', description: 'Công khai, không cần đăng nhập. Sắp xếp theo tên.' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }
}
