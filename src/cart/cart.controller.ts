import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { AUTH_COOKIE_NAME } from '../auth/auth.constants';

@ApiTags('Cart')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // GET /api/cart
  @Get()
  @ApiOperation({ summary: 'Xem giỏ hàng của tôi', description: 'Tổng tiền tính bằng giá khuyến mãi nếu có, không thì giá gốc, trả về dạng số.' })
  @ApiOkResponse({ type: CartResponseDto })
  getCart(@CurrentUserId() userId: string): Promise<CartResponseDto> {
    return this.cartService.getCart(userId);
  }

  // POST /api/cart/items
  @Post('items')
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ', description: 'Nếu sản phẩm đã có trong giỏ thì cộng dồn số lượng. Tổng số lượng không được vượt tồn kho.' })
  @ApiOkResponse({ type: CartResponseDto, description: 'Giỏ hàng sau khi thêm' })
  @ApiBadRequestResponse({ description: 'Dữ liệu sai hoặc số lượng vượt tồn kho' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm' })
  addItem(@CurrentUserId() userId: string, @Body() dto: AddCartItemDto): Promise<CartResponseDto> {
    return this.cartService.addItem(userId, dto);
  }

  // PATCH /api/cart/items/:id
  @Patch('items/:id')
  @ApiOperation({ summary: 'Đổi số lượng một dòng trong giỏ' })
  @ApiParam({ name: 'id', type: Number, description: 'cart_item_id', example: 5 })
  @ApiOkResponse({ type: CartResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu sai hoặc số lượng vượt tồn kho' })
  @ApiForbiddenResponse({ description: 'Dòng giỏ hàng của người khác' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy dòng giỏ hàng' })
  updateItem(
    @CurrentUserId() userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(userId, id, dto);
  }

  // DELETE /api/cart/items/:id
  @Delete('items/:id')
  @ApiOperation({ summary: 'Xóa một dòng khỏi giỏ' })
  @ApiParam({ name: 'id', type: Number, description: 'cart_item_id', example: 5 })
  @ApiOkResponse({ type: CartResponseDto, description: 'Giỏ hàng sau khi xóa' })
  @ApiForbiddenResponse({ description: 'Dòng giỏ hàng của người khác' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy dòng giỏ hàng' })
  removeItem(
    @CurrentUserId() userId: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(userId, id);
  }
}
