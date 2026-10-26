import type { CookieOptions } from 'express';
import { UserRole } from '../user/user.entity';

export const AUTH_COOKIE_NAME = 'access_token';
export const JWT_EXPIRES_IN = '1d';
export const SALT_ROUNDS = 10;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// httpOnly để JavaScript phía trình duyệt không đọc được token (chống XSS)
// sameSite=lax để hạn chế CSRF
export const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export const authCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: ONE_DAY_MS,
};

// Dữ liệu lưu trong JWT
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
