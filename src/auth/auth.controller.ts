import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { AUTH_COOKIE_NAME, authCookieOptions, baseCookieOptions } from './auth.constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản khách hàng', description: 'Tạo tài khoản mới với role customer. Mật khẩu được băm bằng bcrypt.' })
  @ApiCreatedResponse({ type: UserResponseDto, description: 'Đăng ký thành công' })
  @ApiConflictResponse({ description: 'Email đã được sử dụng' })
  register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(dto);
  }

  // POST /api/auth/login - giới hạn 5 lần/phút/IP để chống dò mật khẩu
  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng nhập', description: 'Đăng nhập thành công thì server gắn JWT vào cookie httpOnly tên access_token.' })
  @ApiOkResponse({ type: UserResponseDto, description: 'Đăng nhập thành công' })
  @ApiUnauthorizedResponse({ description: 'Email hoặc mật khẩu không đúng' })
  @ApiTooManyRequestsResponse({ description: 'Đăng nhập sai quá nhiều lần, thử lại sau' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const { token, user } = await this.authService.login(dto);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    return user;
  }

  // POST /api/auth/logout
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đăng xuất', description: 'Xóa cookie access_token.' })
  @ApiOkResponse({ description: 'Đăng xuất thành công' })
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions);
    return { message: 'Đăng xuất thành công' };
  }

  // GET /api/auth/me
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Lấy thông tin người đang đăng nhập' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token hết hạn' })
  me(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.authService.getMe(req.user.sub);
  }
}
