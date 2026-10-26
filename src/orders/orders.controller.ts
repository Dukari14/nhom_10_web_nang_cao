import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseIdPipe } from '../common/pipes';
import { CurrentUserId } from '../auth/current-user.decorator';
import { AUTH_COOKIE_NAME } from '../auth/auth.constants';

@ApiTags('Orders')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/orders
  @Post()
  @ApiOperation({
    summary: 'Đặt hàng từ giỏ hàng',
    description:
      'Tạo đơn, trừ tồn kho, ghi nhận thanh toán và xóa giỏ hàng trong một transaction. Lỗi giữa chừng thì hoàn tác toàn bộ.',
  })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu sai, giỏ hàng trống hoặc sản phẩm không đủ hàng' })
  create(@CurrentUserId() userId: string, @Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersService.create(userId, dto);
  }

  // GET /api/orders
  @Get()
  @ApiOperation({ summary: 'Lịch sử đơn hàng của tôi', description: 'Sắp xếp đơn mới nhất trước.' })
  @ApiOkResponse({ type: [OrderResponseDto] })
  findAll(@CurrentUserId() userId: string): Promise<OrderResponseDto[]> {
    return this.ordersService.findAll(userId);
  }

  // GET /api/orders/:id
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn hàng', description: 'Gồm sản phẩm, thanh toán và trạng thái vận chuyển.' })
  @ApiParam({ name: 'id', type: Number, example: 1024 })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiForbiddenResponse({ description: 'Đơn hàng của người khác' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đơn hàng' })
  findOne(
    @CurrentUserId() userId: string,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(userId, id);
  }
}
