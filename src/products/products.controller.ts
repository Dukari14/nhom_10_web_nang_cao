import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards,} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProductsService, ProductListResult } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LatestProductsQueryDto, ListProductsQueryDto } from './dto/list-products-query.dto';
import {
  ProductDetailResponseDto,
  ProductListResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseIdPipe } from '../common/pipes';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AUTH_COOKIE_NAME } from '../auth/auth.constants';
import { UserRole } from '../user/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /api/products/latest - phải khai báo trước ':id' để không bị hiểu "latest" là id
  @Get('latest')
  @ApiOperation({ summary: 'Điện thoại mới nhất', description: 'Dùng cho trang chủ. Sắp xếp theo ngày tạo giảm dần, chỉ lấy sản phẩm đang bán.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 8, description: 'Số sản phẩm, từ 1 đến 50 (mặc định 8)' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  @ApiBadRequestResponse({ description: 'limit không hợp lệ' })
  findLatest(@Query() query: LatestProductsQueryDto): Promise<Product[]> {
    return this.productsService.findLatest(query.limit);
  }

  // GET /api/products
  @Get()
  @ApiOperation({ summary: 'Tìm kiếm, lọc và phân trang sản phẩm', description: 'Công khai. Mọi tham số đều tùy chọn và kết hợp với nhau bằng AND.' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'samsung', description: 'Tìm theo tên hoặc thương hiệu (LIKE)' })
  @ApiQuery({ name: 'brand', required: false, type: String, example: 'Apple', description: 'Lọc đúng thương hiệu' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, example: 5000000, description: 'Giá thấp nhất (tính theo giá khuyến mãi nếu có)' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, example: 20000000, description: 'Giá cao nhất (tính theo giá khuyến mãi nếu có)' })
  @ApiQuery({ name: 'storage', required: false, type: String, example: '256GB', description: 'Dung lượng bộ nhớ' })
  @ApiQuery({ name: 'color', required: false, type: String, example: 'Đen', description: 'Màu sắc' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Trang, bắt đầu từ 1 (mặc định 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12, description: 'Số sản phẩm mỗi trang, từ 1 đến 50 (mặc định 12)' })
  @ApiOkResponse({ type: ProductListResponseDto })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ (ví dụ minPrice lớn hơn maxPrice)' })
  findAll(@Query() query: ListProductsQueryDto): Promise<ProductListResult> {
    return this.productsService.findAll(query);
  }

  // GET /api/products/:id
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sản phẩm', description: 'Trả về đầy đủ thông tin, cấu hình và danh mục.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: ProductDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm' })
  findOne(@Param('id', ParseIdPipe) id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  // POST /api/products
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Thêm sản phẩm (admin)' })
  @ApiCreatedResponse({ type: ProductDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc danh mục không tồn tại' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không phải admin' })
  @ApiConflictResponse({ description: 'Slug đã tồn tại' })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  // PATCH /api/products/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Sửa sản phẩm (admin)', description: 'Chỉ cần gửi các trường muốn đổi.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: ProductDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc danh mục không tồn tại' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không phải admin' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm' })
  @ApiConflictResponse({ description: 'Slug đã tồn tại' })
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  // DELETE /api/products/:id
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Xóa sản phẩm (admin)', description: 'Không xóa được nếu sản phẩm đã nằm trong giỏ hàng hoặc đơn hàng.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Đã xóa' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không phải admin' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm' })
  @ApiConflictResponse({ description: 'Sản phẩm đang có trong giỏ hàng hoặc đơn hàng' })
  remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    return this.productsService.remove(id);
  }
}
