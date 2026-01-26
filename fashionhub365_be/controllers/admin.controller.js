// const Order = require("../models/Order");
// const User = require("../models/User");

// // UC-50: Thống kê hệ thống
// exports.getSystemStats = async (req, res) => {
//   try {
//     const totalRevenue = await Order.aggregate([
//       { $match: { payment_status: "paid" } },
//       { $group: { _id: null, total: { $sum: "$total_amount" } } },
//     ]);

//     const orderStats = await Order.aggregate([
//       { $group: { _id: "$status", count: { $sum: 1 } } },
//     ]);

//     const totalUsers = await User.countDocuments();

//     res.json({
//       revenue: totalRevenue[0]?.total || 0,
//       orders: orderStats,
//       users: totalUsers,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// tạm thời bỏ qua đăng nhập để test api với postman
const Order = require("../models/Order");

exports.getSystemStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_amount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);
    res.json(stats[0] || { totalRevenue: 0, totalOrders: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
