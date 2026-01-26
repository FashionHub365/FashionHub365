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
const connectDB = require("./config/db");
const initDB = require("./script/initDB");

// Connect to Database
connectDB().then(() => {
  initDB();
});

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API Running"));

// Define Routes
// --- Các route cũ của dự án (nếu có) ---
// app.use('/api/users', require('./routes/api/users'));

// --- Các route mới cho Thành viên 4 (Quy trình Bán hàng & Thanh toán) ---
app.use("/api/orders", require("./routes/order.routes")); // UC-29, 30, 32, 33, 35
app.use("/api/payments", require("./routes/payment.routes")); // UC-36, 37, 38
app.use("/api/admin", require("./routes/admin.routes")); // UC-50

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
