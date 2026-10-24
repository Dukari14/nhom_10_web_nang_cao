# Web bán điện thoại - Nhóm 10

Bài tập lớn môn Web nâng cao, Đại học Phenikaa.

## Giới thiệu

Website bán điện thoại gồm hai phần:

- **Backend** (thư mục gốc): NestJS + TypeORM + MySQL, cung cấp REST API tại `http://localhost:3000/api`.
- **Frontend** (thư mục `react_client`): React, dùng react-bootstrap, chạy tại `http://localhost:3001`.

Chức năng hiện có ở backend:

- Đăng ký, đăng nhập, đăng xuất, xem thông tin tài khoản (`/api/auth/...`).
- Phân quyền theo vai trò `admin` / `customer`.
- Cơ sở dữ liệu gồm các bảng: người dùng, hồ sơ, danh mục, sản phẩm, giỏ hàng, đơn hàng, thanh toán (thiết kế trong `banhang.sql`).

Bảo mật: mật khẩu băm bằng bcrypt, JWT lưu trong cookie httpOnly, CORS chỉ cho phép frontend, helmet, kiểm tra dữ liệu đầu vào bằng class-validator, giới hạn số lần đăng nhập (5 lần/phút).

## Yêu cầu

- Node.js 20 trở lên
- MySQL 8 (hoặc MySQL trong XAMPP), cổng 3306

## Cài đặt

```bash
# 1. Cài thư viện backend
npm install

# 2. Cài thư viện frontend
cd react_client
npm install
cd ..
```

Tạo database và file cấu hình:

```sql
CREATE DATABASE banhang;
```

Sao chép `.env.example` thành `.env` rồi sửa lại cho đúng máy của bạn:

```bash
cp .env.example .env
```

| Biến | Ý nghĩa |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Thông tin kết nối MySQL |
| `JWT_SECRET` | Chuỗi bí mật để ký JWT (bắt buộc) |
| `FRONTEND_ORIGIN` | Địa chỉ frontend được phép gọi API |

Các bảng được tạo tự động khi chạy backend lần đầu (`synchronize: true`). Chỉ dùng cách này khi phát triển.

## Chạy dự án

Bật MySQL, sau đó mở hai terminal.

```bash
# Terminal 1: backend (http://localhost:3000)
npm run start:backend
```

```bash
# Terminal 2: frontend (http://localhost:3001)
cd react_client
# Windows PowerShell:
$env:PORT=3001; npm start
# macOS / Linux / Git Bash:
PORT=3001 npm start
```

Tài liệu API (Swagger): http://localhost:3000/api/docs

## API xác thực

| Method | Đường dẫn | Mô tả |
| --- | --- | --- |
| POST | `/api/auth/register` | Đăng ký (email, password, full_name) |
| POST | `/api/auth/login` | Đăng nhập, server gắn cookie `access_token` |
| POST | `/api/auth/logout` | Đăng xuất, xóa cookie |
| GET | `/api/auth/me` | Thông tin người đang đăng nhập |

## API sản phẩm và danh mục

| Method | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/products/latest?limit=8` | Công khai | Điện thoại mới nhất (trang chủ) |
| GET | `/api/products?search=&brand=&minPrice=&maxPrice=&storage=&color=&page=&limit=` | Công khai | Tìm kiếm, lọc theo giá, dung lượng, màu sắc, có phân trang |
| GET | `/api/products/:id` | Công khai | Chi tiết và cấu hình, 404 nếu không có |
| GET | `/api/categories` | Công khai | Danh sách danh mục |
| POST | `/api/products` | Admin | Thêm sản phẩm |
| PATCH | `/api/products/:id` | Admin | Sửa sản phẩm |
| DELETE | `/api/products/:id` | Admin | Xóa sản phẩm |

## Dữ liệu mẫu

Sau khi chạy backend một lần (để tạo bảng), chạy lệnh sau để thêm 20 điện thoại, 6 danh mục và một tài khoản admin. Chạy lại nhiều lần vẫn an toàn.

```bash
npm run seed
```

Tài khoản admin mẫu: `admin@phoneshop.vn` / `Admin@12345`. Có thể đổi bằng biến `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` trong `.env` trước khi seed.

## Chạy kiểm thử

```bash
npm run test
```

## Cấu trúc thư mục

```
src/
  auth/         đăng ký, đăng nhập, guard, phân quyền
  user/         entity người dùng và hồ sơ
  categories/   danh mục
  products/     sản phẩm: tìm kiếm, lọc, quản lý (admin)
  cart/         entity giỏ hàng
  orders/       entity đơn hàng
  payments/     entity thanh toán
  database/     kết nối MySQL và seed.ts (dữ liệu mẫu)
  common/       bộ lọc lỗi dùng chung
test/           unit test
react_client/   giao diện React
banhang.sql     thiết kế cơ sở dữ liệu
```

## Giấy phép

MIT, xem file [LICENSE](LICENSE).
