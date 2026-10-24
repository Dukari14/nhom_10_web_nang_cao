import { applyDecorators, Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';
import { AUTH_COOKIE_NAME } from '../auth/auth.constants';
import { UserRole } from '../user/user.entity';
import { ParseIdPipe, ParseUuidPipe } from '../common/pipes';
import { AdminOrdersService } from './admin-orders.service';
import { AdminUsersService } from './admin-users.service';
import { AdminStatsService } from './admin-stats.service';
import {
  AdminOrderListResponseDto,
  AdminOrderResponseDto,
  AdminOrdersQueryDto,
  UpdateOrderStatusDto,
} from './dto/admin-orders.dto';
import {
  AdminUserListResponseDto,
  AdminUserResponseDto,
  AdminUsersQueryDto,
  UpdateUserDto,
} from './dto/admin-users.dto';
import { StatsQueryDto, StatsResponseDto } from './dto/admin-stats.dto';

// Mô tả chung cho Swagger: các route admin đều cần cookie đăng nhập và quyền admin
const AdminAuthDocs = () =>
  applyDecorators(
    ApiCookieAuth(AUTH_COOKIE_NAME),
    ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc phiên hết hạn' }),
    ApiForbiddenResponse({ description: 'Không phải admin hoặc tài khoản bị khóa' }),
  );

@ApiTags('Admin - Orders')
@AdminAuthDocs()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  // GET /api/admin/orders
  @Get()
  @ApiOperation({ summary: 'Danh sách đơn hàng của mọi khách', description: 'Lọc theo trạng thái, phân trang, đơn mới nhất trước.' })
  @ApiOkResponse({ type: AdminOrderListResponseDto })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  findAll(@Query() query: AdminOrdersQueryDto): Promise<AdminOrderListResponseDto> {
    return this.adminOrdersService.findAll(query);
  }

  // PATCH /api/admin/orders/:id/status
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái đơn hàng',
    description:
      'Chỉ cho phép: pending → confirmed → shipping → delivered; hủy (cancelled) khi pending hoặc confirmed. Không đi lùi, không bỏ bước. Hủy đơn thì hoàn lại tồn kho; giao xong thì thanh toán chuyển completed.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1024 })
  @ApiOkResponse({ type: AdminOrderResponseDto })
  @ApiBadRequestResponse({ description: 'Chuyển trạng thái không hợp lệ hoặc dữ liệu sai' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đơn hàng' })
  @ApiConflictResponse({ description: 'Đơn vừa được người khác cập nhật' })
  updateStatus(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<AdminOrderResponseDto> {
    return this.adminOrdersService.updateStatus(id, dto.status);
  }
}

@ApiTags('Admin - Users')
@AdminAuthDocs()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // GET /api/admin/users
  @Get()
  @ApiOperation({ summary: 'Danh sách tài khoản', description: 'Tìm theo email hoặc họ tên, lọc theo vai trò và trạng thái khóa. Không trả mật khẩu.' })
  @ApiOkResponse({ type: AdminUserListResponseDto })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  findAll(@Query() query: AdminUsersQueryDto): Promise<AdminUserListResponseDto> {
    return this.adminUsersService.findAll(query);
  }

  // PATCH /api/admin/users/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Khóa, mở khóa tài khoản hoặc đổi vai trò', description: 'Gửi is_active và/hoặc role. Admin không thể tự khóa hoặc tự hạ quyền chính mình.' })
  @ApiParam({ name: 'id', type: String, description: 'user_id (UUID)' })
  @ApiOkResponse({ type: AdminUserResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu sai, ID không đúng UUID hoặc tự khóa chính mình' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tài khoản' })
  update(
    @CurrentUserId() adminId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<AdminUserResponseDto> {
    return this.adminUsersService.update(adminId, id, dto);
  }
}

@ApiTags('Admin - Stats')
@AdminAuthDocs()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  // GET /api/admin/stats
  @Get()
  @ApiOperation({
    summary: 'Thống kê doanh thu',
    description:
      'Tính trên các đơn đã giao (delivered) có ngày đặt trong khoảng from - to. Gồm tổng doanh thu, số điện thoại bán ra, doanh thu theo ngày hoặc tháng và 5 sản phẩm bán chạy nhất.',
  })
  @ApiOkResponse({ type: StatsResponseDto })
  @ApiBadRequestResponse({ description: 'Ngày không hợp lệ, from sau to hoặc khoảng quá 366 ngày' })
  getStats(@Query() query: StatsQueryDto): Promise<StatsResponseDto> {
    return this.adminStatsService.getStats(query);
  }
}
