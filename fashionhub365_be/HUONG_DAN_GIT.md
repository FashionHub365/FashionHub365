# Hướng dẫn đẩy code lên GitHub

Bạn hãy mở Terminal (Ctrl + `) tại thư mục dự án và chạy lần lượt các lệnh sau:

## 1. Kiểm tra trạng thái
Xem các file đã thay đổi:
```bash
git status
```

## 2. Thêm file vào vùng chờ (Staging)
Lệnh này sẽ thêm tất cả thay đổi (trừ những file bị ignore như .env, node_modules):
```bash
git add .
```

## 3. Lưu thay đổi (Commit)
Ghi chú lại những gì bạn đã làm. Ví dụ: "Cập nhật logic gửi email và thêm hướng dẫn test".
```bash
git commit -m "update: fix slow email sending and add test docs"
```

## 4. Đẩy code lên Server (Push)
Đẩy code từ máy bạn lên nhánh `main` trên GitHub:
```bash
git push origin main
```

---

### Lưu ý khi lỗi
Nếu lệnh `git push` báo lỗi (thường là do trên server có code mới mà máy bạn chưa có), hãy chạy lệnh này để tải code về trước:
```bash
git pull origin main
```
Sau đó chạy lại `git push origin main`.
