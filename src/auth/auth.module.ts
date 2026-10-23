import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { JWT_EXPIRES_IN } from './auth.constants';

@Module({
  imports: [
    UserModule,
    // Giá trị mặc định, route login ghi đè bằng @Throttle
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('Thiếu biến môi trường JWT_SECRET trong file .env');
        }
        return { secret, signOptions: { expiresIn: JWT_EXPIRES_IN } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  // Export JwtModule để module khác dùng được JwtAuthGuard
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
