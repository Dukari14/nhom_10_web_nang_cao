# Website bán điện thoại - Nhóm 10

Website bán điện thoại được xây dựng cho môn Web nâng cao, Trường Đại học Phenikaa, Nhóm 10. Khách hàng xem và tìm điện thoại, thêm vào giỏ, đặt hàng và theo dõi đơn. Quản trị viên quản lý sản phẩm, đơn hàng, tài khoản và xem thống kê doanh thu.

Dự án gồm hai phần chạy riêng: backend NestJS (REST API, cổng 3000) và giao diện React trong thư mục `react_client` (cổng 3001).

## Mục lục

1. [Chức năng](#1-chức-năng)
2. [Công nghệ](#2-công-nghệ)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Yêu cầu cài đặt](#4-yêu-cầu-cài-đặt)
5. [Hướng dẫn chạy](#5-hướng-dẫn-chạy)
6. [Tài khoản dùng thử](#6-tài-khoản-dùng-thử)
7. [Tóm tắt API](#7-tóm-tắt-api)
8. [Quy tắc nghiệp vụ chính](#8-quy-tắc-nghiệp-vụ-chính)
9. [Bảo mật](#9-bảo-mật)
10. [Kiểm thử](#10-kiểm-thử)
11. [Ảnh sản phẩm](#11-ảnh-sản-phẩm)
12. [Thành viên và đóng góp](#12-thành-viên-và-đóng-góp)
13. [Giới hạn đã biết và hướng phát triển](#13-giới-hạn-đã-biết-và-hướng-phát-triển)

## 1. Chức năng

Bám theo 15 user story trong [docs/user-stories.md](docs/user-stories.md). Cả 15 story đều đã thực hiện.

### Khách hàng

| Story | Chức năng |
| --- | --- |
| 1 | Đăng ký tài khoản bằng email, họ tên và mật khẩu từ 8 ký tự (`/register`). |
| 2 | Đăng nhập, đăng xuất, giữ phiên bằng cookie (`/login`). |
| 3 | Xem danh sách điện thoại mới nhất trên trang chủ. |
| 4 | Tìm kiếm theo tên hoặc thương hiệu. |
| 5 | Lọc theo khoảng giá, dung lượng bộ nhớ, màu sắc (thêm lọc theo hãng) và phân trang. |
| 6 | Xem chi tiết và cấu hình từng điện thoại. |
| 7 | Thêm điện thoại vào giỏ hàng, số lượng không vượt tồn kho. |
| 8 | Đổi số lượng hoặc xóa sản phẩm khỏi giỏ. |
| 9 | Đặt hàng từ giỏ, chọn thanh toán khi nhận hàng (COD) hoặc chuyển khoản. Chưa có thanh toán trực tuyến thật, thông tin chuyển khoản chỉ là minh họa. |
| 10 | Xem lịch sử đơn hàng, trạng thái đơn và trạng thái thanh toán. |

### Quản trị viên

| Story | Chức năng |
| --- | --- |
| 11 | Đăng nhập bằng form chung; tài khoản admin được chuyển tới khu quản trị `/admin`. |
| 12 | Thêm, sửa, xóa điện thoại, gồm cả sản phẩm đang ẩn. |
| 13 | Xem danh sách đơn, lọc theo trạng thái, cập nhật trạng thái theo đúng luồng. |
| 14 | Xem danh sách tài khoản, khóa hoặc mở khóa, đổi vai trò. |
| 15 | Xem thống kê doanh thu, số điện thoại bán ra, doanh thu theo ngày hoặc tháng và top 5 sản phẩm bán chạy. |

## 2. Công nghệ

Phiên bản lấy từ `package.json` (ghi theo khoảng phiên bản khai báo).

| Phần | Công nghệ |
| --- | --- |
| Backend | NestJS `^12.0.1`, TypeScript `^6.0.2` |
| ORM và cơ sở dữ liệu | TypeORM `^1.1.1`, `mysql2` `^3.24.6`, MySQL hoặc MariaDB |
| Xác thực | `@nestjs/jwt` `^12.0.3` (JWT lưu trong cookie httpOnly), `bcrypt` `^6.0.0`, `cookie-parser` `^1.4.7` |
| Bảo mật | `helmet` `^8.3.0`, `@nestjs/throttler` `^6.7.1`, `class-validator` `^0.15.1`, `class-transformer` `^0.5.1` |
| Tài liệu API | `@nestjs/swagger` `^12.0.3` |
| Kiểm thử | Jest `^30.0.0` và `ts-jest` (backend); Jest của `react-scripts` 5.0.1 và Testing Library (frontend) |
| Frontend | React `^19.3.0`, react-bootstrap `^2.10.10`, Bootstrap `^5.3.8`, react-router-dom `^6.30.6`, axios `^1.20.0` |
| Font | Be Vietnam Pro (`@fontsource/be-vietnam-pro` `^5.3.0`) |

## 3. Cấu trúc thư mục

```
.
├── src/                     Mã nguồn backend NestJS
│   ├── auth/                Đăng ký, đăng nhập, JWT, guard, phân quyền
│   ├── user/                Entity người dùng và hồ sơ
│   ├── categories/          Danh mục
│   ├── products/            Sản phẩm: tìm kiếm, lọc, quản lý
│   ├── cart/                Giỏ hàng
│   ├── orders/              Đơn hàng
│   ├── payments/            Ghi nhận thanh toán
│   ├── admin/               API riêng cho quản trị viên
│   ├── common/              Bộ lọc lỗi, xử lý tiền, kiểm tra dữ liệu dùng chung
│   ├── database/            Kết nối MySQL, seed dữ liệu mẫu
│   └── main.ts              Điểm khởi động (cổng, CORS, helmet, Swagger)
├── test/                    Unit test backend
├── react_client/            Giao diện React
│   ├── public/images/products/   Ảnh sản phẩm
│   └── src/                 pages, components, context, utils
├── docs/                    Tài liệu: user story, phân tích, sơ đồ, wireframe
├── banhang.sql              Thiết kế cơ sở dữ liệu (tham khảo)
├── Database BanHang.drawio  Sơ đồ cơ sở dữ liệu
├── .env.example             Mẫu cấu hình backend
└── LICENSE                  Giấy phép MIT
```

Mỗi module backend theo cấu trúc controller, service, entity (và provider để tạo repository). Bảng trong database do TypeORM tự tạo khi ứng dụng hoặc lệnh seed kết nối (`synchronize: true`), nên không cần import `banhang.sql`.

## 4. Yêu cầu cài đặt

| Phần mềm | Ghi chú |
| --- | --- |
| Node.js và npm | Dự án đã chạy với Node.js v24.19.0 và npm 11.17.0. Chưa thử các phiên bản khác. |
| MySQL hoặc MariaDB | Dùng bản đi kèm XAMPP (đã chạy với MariaDB 10.4.32), cổng 3306. |

Lưu ý: tên database viết chữ thường, `banhang`. Trên Windows, MySQL lưu tên database chữ thường; viết `BanHang` có thể làm TypeORM không nhận ra các bảng đã có và báo lỗi bảng đã tồn tại khi khởi động lần sau.

## 5. Hướng dẫn chạy

### Bước 1. Bật MySQL và tạo database

Mở XAMPP Control Panel, bấm Start ở dòng MySQL. Tạo database bằng phpMyAdmin hoặc bằng dòng lệnh (tài khoản `root`, XAMPP mặc định không có mật khẩu):

```bash
mysql -u root -e "CREATE DATABASE banhang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Nếu máy báo không tìm thấy lệnh `mysql`, chạy tệp `mysql.exe` trong thư mục `mysql/bin` của XAMPP.

### Bước 2. Tạo file cấu hình

Backend (ở thư mục gốc):

```bash
cp .env.example .env
```

Trên PowerShell hoặc CMD dùng `copy .env.example .env`. Sau đó mở `.env` và sửa:

| Biến | Ý nghĩa | Giá trị mẫu |
| --- | --- | --- |
| `DB_HOST` | Địa chỉ MySQL | `localhost` |
| `DB_PORT` | Cổng MySQL | `3306` |
| `DB_USERNAME` | Tài khoản MySQL | `root` |
| `DB_PASSWORD` | Mật khẩu MySQL (bỏ trống nếu không đặt) | để trống |
| `DB_NAME` | Tên database | `banhang` |
| `JWT_SECRET` | Chuỗi bí mật để ký JWT. Bắt buộc, thiếu thì backend không khởi động. | chuỗi ngẫu nhiên dài |
| `FRONTEND_ORIGIN` | Địa chỉ giao diện được phép gọi API (CORS) | `http://localhost:3001` |

Tạo chuỗi ngẫu nhiên cho `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Các biến tùy chọn (không có trong `.env.example`): `PORT` (cổng backend, mặc định `3000`), `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD` (xem mục 6), `NODE_ENV=production` (bật cờ `secure` cho cookie).

Frontend:

```bash
cd react_client
cp .env.example .env
cd ..
```

| Biến | Ý nghĩa | Giá trị mẫu |
| --- | --- | --- |
| `PORT` | Cổng chạy giao diện | `3001` |
| `REACT_APP_API_URL` | Địa chỉ API của backend | `http://localhost:3000/api` |

Thiếu file này, React sẽ chạy ở cổng 3000 và trùng với backend.

### Bước 3. Cài thư viện

```bash
npm install
cd react_client
npm install
cd ..
```

### Bước 4. Nạp dữ liệu mẫu

```bash
npm run seed
```

Lệnh này tạo các bảng, 6 danh mục, 20 điện thoại mẫu (kèm ảnh) và một tài khoản admin. Chạy lại nhiều lần vẫn an toàn: không xóa dữ liệu và không ghi đè phần đã sửa.

### Bước 5. Chạy backend

```bash
npm run start:backend
```

Backend chạy ở http://localhost:3000, mọi API có tiền tố `/api`. Tài liệu Swagger: http://localhost:3000/api/docs.

Chú ý: ở thư mục gốc, `npm start` và `npm run start:dev` chạy giao diện React chứ không phải backend. Để chạy backend dạng build sẵn: `npm run build` rồi `npm run start:prod`.

### Bước 6. Chạy giao diện

Mở một cửa sổ terminal khác:

```bash
cd react_client
npm start
```

Mở http://localhost:3001.

Backend chỉ cho phép gọi API từ địa chỉ ghi trong `FRONTEND_ORIGIN` (mặc định cổng 3001) và cho phép gửi cookie kèm theo, vì đăng nhập dùng cookie httpOnly. Nếu mở giao diện bằng địa chỉ hoặc cổng khác, trình duyệt sẽ chặn request; khi đó hãy sửa `FRONTEND_ORIGIN` cho khớp rồi chạy lại backend.

## 6. Tài khoản dùng thử

Tài khoản dưới đây là tài khoản DEMO do `npm run seed` tạo, chỉ dùng để chấm bài và thử nghiệm.

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin@phoneshop.vn` | `Admin@12345` |

Muốn đặt email hoặc mật khẩu khác, thêm hai dòng sau vào `.env` trước khi chạy `npm run seed` lần đầu:

```
SEED_ADMIN_EMAIL=email-quan-tri-cua-ban@example.com
SEED_ADMIN_PASSWORD=mat-khau-cua-ban
```

Hai biến này chỉ có tác dụng khi seed tạo tài khoản mới; nếu tài khoản admin đã tồn tại, seed giữ nguyên. Ứng dụng chưa có chức năng đổi mật khẩu. Tài khoản khách hàng tạo bằng trang `/register`.

## 7. Tóm tắt API

Mọi đường dẫn có tiền tố `/api`. Chi tiết tham số và phản hồi xem ở Swagger: http://localhost:3000/api/docs.

Cột quyền: "Công khai" không cần đăng nhập; "Khách hàng" cần đăng nhập và chỉ truy cập dữ liệu của chính mình; "Quản trị viên" cần tài khoản có vai trò admin.

### Xác thực

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Công khai | Đăng ký (email, mật khẩu, họ tên) |
| POST | `/api/auth/login` | Công khai | Đăng nhập, gắn cookie `access_token`. Tối đa 5 lần mỗi phút. |
| POST | `/api/auth/logout` | Công khai | Đăng xuất, xóa cookie |
| GET | `/api/auth/me` | Khách hàng | Thông tin người đang đăng nhập |

### Sản phẩm và danh mục

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/categories` | Công khai | Danh sách danh mục |
| GET | `/api/products/latest` | Công khai | Điện thoại mới nhất (`limit`) |
| GET | `/api/products` | Công khai | Tìm kiếm, lọc, phân trang (`search`, `brand`, `minPrice`, `maxPrice`, `storage`, `color`, `page`, `limit`) |
| GET | `/api/products/:id` | Công khai | Chi tiết sản phẩm |
| POST | `/api/products` | Quản trị viên | Thêm sản phẩm |
| PATCH | `/api/products/:id` | Quản trị viên | Sửa sản phẩm |
| DELETE | `/api/products/:id` | Quản trị viên | Xóa sản phẩm |

### Giỏ hàng và đơn hàng

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/cart` | Khách hàng | Xem giỏ hàng và tổng tiền |
| POST | `/api/cart/items` | Khách hàng | Thêm sản phẩm (`productId`, `quantity`) |
| PATCH | `/api/cart/items/:id` | Khách hàng | Đổi số lượng |
| DELETE | `/api/cart/items/:id` | Khách hàng | Xóa một dòng khỏi giỏ |
| POST | `/api/orders` | Khách hàng | Đặt hàng từ giỏ (`shipping_address`, `phone`, `payment_method`) |
| GET | `/api/orders` | Khách hàng | Lịch sử đơn của mình |
| GET | `/api/orders/:id` | Khách hàng | Chi tiết đơn, người khác xem sẽ bị từ chối (403) |

### Quản trị

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/admin/products` | Quản trị viên | Danh sách sản phẩm gồm cả sản phẩm đang ẩn, kèm danh mục |
| GET | `/api/admin/orders` | Quản trị viên | Danh sách đơn của mọi khách, lọc theo trạng thái, phân trang |
| PATCH | `/api/admin/orders/:id/status` | Quản trị viên | Cập nhật trạng thái đơn |
| GET | `/api/admin/users` | Quản trị viên | Danh sách tài khoản (`search`, `role`, `is_active`, `page`, `limit`) |
| PATCH | `/api/admin/users/:id` | Quản trị viên | Khóa hoặc mở khóa, đổi vai trò |
| GET | `/api/admin/stats` | Quản trị viên | Thống kê (`from`, `to`, `groupBy`) |

Mọi lỗi trả về cùng một dạng JSON: `statusCode`, `error`, `message` (tiếng Việt), `path`, `timestamp`.

## 8. Quy tắc nghiệp vụ chính

- **Luồng trạng thái đơn hàng:** `pending` (Chờ xác nhận) → `confirmed` (Đang xử lý) → `shipping` (Đang giao) → `delivered` (Đã giao). Không đi lùi, không bỏ bước. Chỉ hủy (`cancelled`) được khi đơn đang `pending` hoặc `confirmed`; đơn đang giao thì không hủy được.
- **Khi hủy hoặc giao xong:** hủy đơn trả lại tồn kho và đánh dấu thanh toán thất bại; đơn đã giao thì thanh toán chuyển sang hoàn tất.
- **Đặt hàng:** tạo đơn, lưu giá từng sản phẩm tại thời điểm đặt, trừ tồn kho, ghi thanh toán và xóa giỏ nằm trong một transaction. Lỗi giữa chừng thì hoàn tác toàn bộ. Giá tính là giá khuyến mãi nếu có, không thì giá gốc.
- **Tiền:** tính theo đơn vị nhỏ nhất (xu, số nguyên bằng tiền nhân 100) rồi mới đổi lại, để không sai số khi cộng. API trả tiền của giỏ và đơn dạng số.
- **Giới hạn tiền:** tổng giá trị một đơn tối đa 999.999.999.999đ (cột `DECIMAL(14,2)`); vượt thì server từ chối với thông báo tiếng Việt. Giá một sản phẩm tối đa 99.999.999,99đ. Mỗi lần thêm hoặc đổi số lượng trong giỏ tối đa 100 máy.
- **Thống kê:** doanh thu và số điện thoại bán ra chỉ tính các đơn đã giao, theo ngày đặt hàng. Mặc định 30 ngày gần nhất, tối đa 366 ngày.
- **Tài khoản bị khóa:** không đăng nhập được, phiên đang dùng bị từ chối ở lần gọi tiếp theo. Quản trị viên không thể tự khóa hoặc tự hạ quyền chính mình.
- **Xóa sản phẩm:** không xóa được sản phẩm đã nằm trong giỏ hoặc đơn hàng; hãy bỏ chọn "Đang bán" để ẩn.

## 9. Bảo mật

- Mật khẩu băm bằng bcrypt, không bao giờ trả `password_hash` ra API.
- JWT lưu trong cookie httpOnly, `sameSite=lax`, hết hạn sau 1 ngày; cờ `secure` bật khi `NODE_ENV=production`. Frontend không lưu token ở trình duyệt.
- Mỗi request kiểm tra lại tài khoản trong database, nên khóa tài khoản hoặc đổi vai trò có hiệu lực ngay.
- Phân quyền theo vai trò (`admin`, `customer`); khách hàng chỉ xem được giỏ và đơn của chính mình.
- Giới hạn đăng nhập 5 lần mỗi phút (`@nestjs/throttler`).
- Kiểm tra dữ liệu đầu vào bằng DTO và `class-validator`; trường không khai báo bị từ chối.
- `helmet` thêm các header bảo mật; CORS chỉ cho địa chỉ trong `FRONTEND_ORIGIN`.
- Truy vấn tìm kiếm dùng tham số hóa (QueryBuilder) và thoát ký tự đặc biệt của `LIKE`.
- Bộ lọc lỗi dùng chung trả JSON thống nhất bằng tiếng Việt, không lộ stack trace hay câu lệnh SQL.

## 10. Kiểm thử

Backend (Jest, unit test dùng dữ liệu giả, không cần database):

```bash
npm test
```

Hiện có 12 file test, 103 test, đều pass.

Frontend (chạy một lần, không vào chế độ theo dõi):

```bash
cd react_client
npm test -- --watchAll=false
```

Hiện có 6 file test, 56 test, đều pass.

Lệnh `npm run test:e2e` ở thư mục gốc chưa dùng được: file `test/app.e2e-spec.ts` là mẫu có sẵn của NestJS, đang kỳ vọng đường dẫn `/` trả "Hello World!" và hiện không pass.

## 11. Ảnh sản phẩm

Ảnh nằm trong `react_client/public/images/products/`. Cơ sở dữ liệu lưu đường dẫn tương đối dạng `/images/products/<tên-file>`, giao diện (cổng 3001) phục vụ trực tiếp các file này. Admin cũng có thể nhập đường dẫn `https://...` ở form sản phẩm.

Nguồn ảnh: xem bảng trong báo cáo.

## 12. Thành viên trong nhóm

| Họ tên | MSSV |
| --- | --- | --- |
| Đỗ Việt Dũng | 23010547 |
| Đỗ Bảo Long | 23010561 |
| Phạm Tiến Chiêu | 23010526 |

## 13. Giới hạn đã biết và hướng phát triển

Giới hạn hiện tại:

- Khách hàng chưa tự hủy được đơn; chỉ quản trị viên đổi trạng thái đơn.
- Chưa có thanh toán trực tuyến thật. Thông tin chuyển khoản ở trang thanh toán là dữ liệu minh họa; đơn chuyển khoản ở trạng thái chưa thanh toán cho đến khi quản trị viên chuyển đơn sang đã giao.
- Bộ lọc dung lượng bộ nhớ và màu sắc dùng danh sách cố định trong `react_client/src/utils/constants.js`, chưa lấy từ dữ liệu thật. Danh sách sản phẩm chưa có tùy chọn sắp xếp.
- Chưa có chức năng đổi mật khẩu, quên mật khẩu hay xác thực email.
- Bảng `reviews` có trong `banhang.sql` nhưng chưa có chức năng đánh giá sản phẩm.
- Cấu trúc bảng do TypeORM đồng bộ tự động (`synchronize: true`), phù hợp khi học tập và phát triển; chưa có migration cho môi trường thật.
- Mô tả của vài sản phẩm mẫu lặp tên hãng (ví dụ "Realme Realme C67").
- `npm run test:e2e` chưa dùng được (xem mục 10).

Hướng phát triển: cho khách tự hủy đơn khi chưa xác nhận, tích hợp cổng thanh toán, thêm đánh giá sản phẩm, lấy danh sách bộ lọc từ dữ liệu, thêm sắp xếp, chuyển sang migration.

## Giấy phép

MIT, xem [LICENSE](LICENSE). Giao diện có README riêng tại [react_client/README.md](react_client/README.md).
