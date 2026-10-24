# Giao diện web bán điện thoại (React)

Phần giao diện của dự án Nhóm 10, Đại học Phenikaa. Viết bằng React và react-bootstrap, gọi API của backend NestJS ở thư mục gốc của repo.

## Các trang hiện có

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Trang chủ: ô tìm kiếm lớn, danh sách điện thoại mới nhất |
| `/products` | Danh sách sản phẩm: tìm kiếm, bộ lọc giá, dung lượng, màu, hãng, phân trang |
| `/products/:id` | Chi tiết sản phẩm và cấu hình |
| `/login`, `/register` | Đăng nhập và đăng ký |
| `/cart`, `/admin` | Trang tạm, sẽ làm ở bước sau |

Bộ lọc ở trang danh sách nằm trên đường dẫn (ví dụ `/products?search=samsung&color=Đen&page=2`), nên tải lại trang hoặc gửi link vẫn giữ nguyên kết quả.

## Yêu cầu

- Node.js 20 trở lên
- Backend đang chạy tại `http://localhost:3000` (xem [README ở thư mục gốc](../README.md))

## Cài đặt và chạy

```bash
npm install
cp .env.example .env
npm start
```

Mở http://localhost:3001.

## Biến môi trường

Khai báo trong file `.env` (file này không đưa lên Git, mẫu ở `.env.example`):

| Biến | Ý nghĩa | Giá trị mẫu |
| --- | --- | --- |
| `PORT` | Cổng chạy giao diện (backend chỉ cho phép CORS từ cổng này) | `3001` |
| `REACT_APP_API_URL` | Địa chỉ API của backend | `http://localhost:3000/api` |

Đổi `.env` thì phải dừng và chạy lại `npm start`.

## Đăng nhập hoạt động thế nào

Backend lưu JWT trong cookie `httpOnly`, trình duyệt tự gửi kèm mỗi request (`withCredentials`). Ứng dụng không lưu token, mật khẩu hay thông tin người dùng vào `localStorage`. Mỗi lần tải trang, ứng dụng gọi `GET /auth/me` để biết phiên còn hiệu lực không.

Nếu bạn mở giao diện bằng địa chỉ khác `http://localhost:3001`, hãy sửa `FRONTEND_ORIGIN` trong `.env` của backend cho khớp, nếu không trình duyệt sẽ chặn request.

## Cấu trúc thư mục

```
src/
  api.js            axios dùng chung (baseURL, withCredentials)
  context/          AuthContext: trạng thái đăng nhập
  components/       thanh điều hướng, chân trang, thẻ sản phẩm, thanh tìm kiếm, phân trang
  pages/            danh sách, chi tiết, đăng nhập/đăng ký, trang tạm
  web-users/        trang chủ
  utils/            định dạng giá, xử lý lỗi, hằng số bộ lọc
```

## Lệnh khác

```bash
npm run build     # build bản chạy thật vào thư mục build/
npm test          # chạy unit test (định dạng giá, tên sản phẩm...)
```
