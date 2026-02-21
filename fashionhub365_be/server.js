// require('dotenv').config();
// const express = require('express');
// const connectDB = require('./config/db');
// const initDB = require('./script/initDB');

// // Connect to Database
// connectDB().then(() => {
//     initDB();
// });

// const app = express();

// // Init Middleware
// app.use(express.json({ extended: false }));

// app.get('/', (req, res) => res.send('API Running'));

// // Define Routes (to be added)
// // app.use('/api/users', require('./routes/api/users'));

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const initDB = require("./script/initDB");

// Connect to Database
connectDB().then(() => {
  initDB();
});

const app = express();

// Init Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API Running"));

// Define Routes
// --- Các route cũ của dự án (nếu có) ---
// app.use('/api/users', require('./routes/api/users'));

// --- Các route mới cho Thành viên 4 (Quy trình Bán hàng & Thanh toán) ---
app.use("/api/orders", require("./routes/order.routes")); // UC-29, 30, 32, 33, 35
app.use("/api/admin", require("./routes/admin.routes")); // UC-50
app.use("/api/products", require("./routes/product.routes")); // UC-09
app.use("/api/upload", require("./routes/upload.routes"));  // Image upload

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
