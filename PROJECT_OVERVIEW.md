# FashionHub365: API & Project Flow Documentation

## 1. Danh sách API (v1)

**Base URL:** `http://localhost:5000/api/v1` (mặc định cho development)

### Authentication (`/auth`)

| Method | Endpoint                   | Description                             | Auth Required |
| :----- | :------------------------- | :-------------------------------------- | :------------ |
| POST   | `/register`                | Đăng ký tài khoản mới                   | Không         |
| POST   | `/login`                   | Đăng nhập hệ thống                      | Không         |
| POST   | `/logout`                  | Đăng xuất                               | Có            |
| POST   | `/refresh-token`           | Làm mới Access Token bằng Refresh Token | Không         |
| GET    | `/me`                      | Lấy thông tin cá nhân hiện tại          | Có            |
| POST   | `/change-password`         | Thay đổi mật khẩu                       | Có            |
| POST   | `/forgot-password`         | Gửi email đặt lại mật khẩu              | Không         |
| POST   | `/reset-password`          | Đặt lại mật khẩu mới                    | Không         |
| POST   | `/verify-email`            | Xác thực địa chỉ email                  | Không         |
| POST   | `/send-verification-email` | Gửi lại email xác thực                  | Có            |

### Quản lý User (`/users`)

| Method | Endpoint   | Description                           | Role Required   |
| :----- | :--------- | :------------------------------------ | :-------------- |
| POST   | `/`        | Tạo người dùng mới                    | Admin           |
| GET    | `/`        | Lấy danh sách tất cả người dùng       | Admin           |
| GET    | `/:userId` | Lấy thông tin chi tiết một người dùng | Admin/Chính chủ |
| PATCH  | `/:userId` | Cập nhật thông tin người dùng         | Admin/Chính chủ |
| DELETE | `/:userId` | Xoá người dùng                        | Admin/Chính chủ |

### Quản lý Sản phẩm (`/products`)

| Method | Endpoint            | Description                            | Role Required   |
| :----- | :------------------ | :------------------------------------- | :-------------- |
| POST   | `/`                 | Đăng bán sản phẩm mới                  | Seller          |
| GET    | `/seller`           | Danh sách sản phẩm của Seller hiện tại | Seller          |
| GET    | `/:id`              | Lấy thông tin chi tiết sản phẩm        | Công khai       |
| PUT    | `/:id`              | Cập nhật thông tin sản phẩm            | Seller (Chủ SP) |
| DELETE | `/:id`              | Xoá sản phẩm                           | Seller (Chủ SP) |
| PATCH  | `/:id/stock-status` | Bật/tắt trạng thái còn hàng/hết hàng   | Seller (Chủ SP) |

### Quản lý Đơn hàng (`/orders`)

| Method | Endpoint          | Description                                           | Role Required |
| :----- | :---------------- | :---------------------------------------------------- | :------------ |
| GET    | `/seller/history` | Xem lịch sử đơn hàng của Seller                       | Seller        |
| POST   | `/:id/confirm`    | Xác nhận đơn hàng khách đã đặt                        | Seller        |
| POST   | `/:id/cancel`     | Hủy đơn hàng                                          | Seller        |
| PATCH  | `/:id/status`     | Cập nhật trạng thái giao hàng (Đang giao, Đã giao...) | Seller        |

### Quản trị Hệ thống (`/admin`)

| Method   | Endpoint          | Description                     | Role Required |
| :------- | :---------------- | :------------------------------ | :------------ |
| GET      | `/stats`          | Thống kê tổng quan hệ thống     | Admin         |
| GET      | `/categories`     | Lấy danh sách danh mục sản phẩm | Công khai     |
| POST     | `/categories`     | Tạo danh mục mới                | Admin         |
| PUT      | `/categories/:id` | Cập nhật danh mục               | Admin         |
| DELETE   | `/categories/:id` | Xoá danh mục                    | Admin         |
| GET/POST | `/roles`          | Quản lý vai trò (Role)          | Admin         |
| GET/POST | `/permissions`    | Quản lý quyền hạn (Permission)  | Admin         |

### Tải lên hình ảnh (`/upload`)

| Method | Endpoint     | Description                  | Auth Required |
| :----- | :----------- | :--------------------------- | :------------ |
| POST   | `/single`    | Tải lên 1 hình ảnh           | Có            |
| POST   | `/multiple`  | Tải lên tối đa 5 hình ảnh    | Có            |
| DELETE | `/:publicId` | Xoá hình ảnh khỏi Cloudinary | Có            |

---

## 2. Sơ đồ luồng hoạt động (Project Flow)

### Kiến trúc tổng thể

Dự án được xây dựng theo mô hình **MERN Stack** (MongoDB, Express, React, Node.js):

- **Frontend**: React SPA nằm trong thư mục `fashionhub365_fe`.
- **Backend**: Node.js API nằm trong thư mục `fashionhub365_be`.

### Luồng đi của một Request

1.  **Frontend**: Người dùng tương tác với giao diện (ví dụ: nhấn nút "Đăng bán").
2.  **API Service**: Frontend gọi hàm trong `src/services/productService.js`, hàm này sử dụng `axiosClient` để gửi request đến Backend.
3.  **Backend Entry**: Request đến `server.js` -> đi qua các Middleware (Helmet, CORS, Morgan).
4.  **Routing**: `routes/index.js` điều hướng request đến đúng module (ví dụ: `routes/product.routes.js`).
5.  **Middleware thực thi**:
    - `auth()`: Kiểm tra token người dùng có hợp lệ không.
    - `authorize()`: Kiểm tra người dùng có quyền (ví dụ: `PRODUCT.CREATE`) không.
    - `validate()`: Kiểm tra dữ liệu gửi lên (body/query) có đúng định dạng không.
6.  **Controller**: `controllers/product.controller.js` tiếp nhận và xử lý logic nghiệp vụ sơ bộ.
7.  **Service**: `services/product.service.js` thực hiện các tính năng phức tạp và tương tác với Database.
8.  **Model**: `models/product.model.js` thực hiện truy vấn vào MongoDB.
9.  **Response**: Dữ liệu được trả về theo dạng JSON -> Frontend nhận và cập nhật UI.

### Luồng nghiệp vụ chính

- **Luồng Đăng ký/Đăng nhập**: Sử dụng JWT với cơ chế Double Token (Access Token lưu ngắn hạn, Refresh Token lưu dài hạn để cấp mới Access Token).
- **Luồng Đăng bán**: Seller tải ảnh lên Cloudinary qua `/upload` -> Lấy URL ảnh -> Gửi kèm thông tin sản phẩm lên `/products`.
- **Luồng Đơn hàng**: Khách đặt hàng (đang phát triển) -> Seller nhận thông báo -> Confirm đơn hàng -> Cập nhật trạng thái giao hàng -> Hoàn tất.
