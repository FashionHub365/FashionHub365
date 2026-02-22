require("dotenv").config(); // Load biến môi trường đầu tiên

// ==========================================
// 1. IMPORTS
// ==========================================
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/config');
const connectDB = require('./config/db');
const initDB = require('./script/initDB');
const routes = require('./routes'); // Centralized routes của team
const errorHandler = require('./middleware/error');
const ApiError = require('./utils/ApiError');

// Khởi tạo app
const app = express();

// ==========================================
// 2. MIDDLEWARES (Xử lý request trước khi vào Route)
// ==========================================
// Cấu hình bảo mật HTTP headers
app.use(helmet());

// Cấu hình CORS cho frontend
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));

// Ghi log request (Chỉ chạy ở môi trường development)
const env = config?.env || process.env.NODE_ENV || 'development';
if (env === 'development') {
    app.use(morgan('dev'));
}

// Body parsers (Đọc dữ liệu từ body của request)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 3. ROUTES (Định tuyến API)
// ==========================================
// Health check
app.get('/', (req, res) => res.send('FashionHub365 API Running'));

// Các route tổng của dự án
app.use('/api/v1', routes);

// ==========================================
// 4. ERROR HANDLING (BẮT BUỘC PHẢI ĐỂ CUỐI CÙNG)
// ==========================================
// Bắt lỗi 404 (Không tìm thấy route)
app.use((req, res, next) => {
    next(new ApiError(404, 'Not found'));
});

// Hàm xử lý lỗi tập trung toàn cục
app.use(errorHandler);

// ==========================================
// 5. KẾT NỐI DATABASE & KHỞI ĐỘNG SERVER
// ==========================================
const PORT = config?.port || process.env.PORT || 5000;

connectDB()
    .then(() => {
        // Chạy script khởi tạo DB (nếu có)
        if (typeof initDB === 'function') {
            initDB();
        }

        // Chỉ bật server sau khi đã kết nối DB thành công
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT} in ${env} mode`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to database:", err);
        process.exit(1); // Dừng app nếu không kết nối được DB
    });