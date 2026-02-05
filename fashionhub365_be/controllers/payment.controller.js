// const Payment = require("../models/Payment");
// const PaymentMethod = require("../models/PaymentMethod");
// const Order = require("../models/Order");

// // UC-36: Lấy danh sách phương thức thanh toán khả dụng
// exports.getPaymentMethods = async (req, res) => {
//   try {
//     const methods = await PaymentMethod.find({ enabled: true });
//     res.json(methods);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // UC-37: Thực hiện thanh toán (Logic cơ bản)
// exports.processPayment = async (req, res) => {
//   const { order_id, method, amount } = req.body;
//   try {
//     const newPayment = new Payment({
//       order_id,
//       method,
//       amount,
//       status: "paid", // Hoặc 'pending' tùy cổng thanh toán
//       paid_at: new Date(),
//     });
//     await newPayment.save();

//     // Cập nhật trạng thái thanh toán trong đơn hàng
//     await Order.findByIdAndUpdate(order_id, { payment_status: "paid" });

//     res.status(201).json(newPayment);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // UC-38: Lịch sử thanh toán (Cá nhân)
// exports.getPaymentHistory = async (req, res) => {
//   try {
//     const payments = await Payment.find().populate("order_id");
//     res.json(payments);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// tạm thời bỏ qua đăng nhập để test api với postman
const Payment = require("../models/Payment");
const PaymentMethod = require("../models/PaymentMethod");
const Order = require("../models/Order");

// UC-36: Lấy danh sách phương thức
exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find();
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UC-37: Thanh toán (Dùng _id của Order)
exports.processPayment = async (req, res) => {
  try {
    const { order_id, method, amount } = req.body;
    const newPayment = new Payment({
      order_id, // Truyền _id từ MongoDB vào đây
      method,
      amount,
      status: "paid",
      paid_at: new Date(),
    });
    await newPayment.save();
    await Order.findByIdAndUpdate(order_id, { payment_status: "paid" });
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UC-38: Lịch sử thanh toán
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find().populate("order_id");
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
