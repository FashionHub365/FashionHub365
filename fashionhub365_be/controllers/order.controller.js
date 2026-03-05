const Order = require("../models/Order");
const { productService } = require("../services");
const Product = require("../models/Product");
const StoreMember = require("../models/StoreMember");
const Store = require("../models/Store");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

// Thống kê cho Seller Dashboard
exports.getStoreStats = catchAsync(async (req, res) => {
  // 1. Tìm store của user này (có thể là Owner hoặc Member)
  let storeId = null;

  // 1a. Check xem user có phải là Owner của store nào không
  const ownedStore = await Store.findOne({ owner_user_id: req.user._id });
  if (ownedStore) {
    storeId = ownedStore._id;
  } else {
    // 1b. Nếu không phải owner, check trong StoreMember
    const member = await StoreMember.findOne({ user_id: req.user._id, status: "ACTIVE" });
    if (member) {
      storeId = member.store_id;
    }
  }

  if (!storeId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Không tìm thấy thông tin cửa hàng cho user này. Vui lòng tạo cửa hàng hoặc liên hệ admin.");
  }

  // 2. Tổng quan (Doanh thu, số đơn, số SP của store)
  const [orderSummary, totalProducts] = await Promise.all([
    Order.aggregate([
      { $match: { store_id: storeId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_amount" },
          totalOrders: { $sum: 1 },
          paidRevenue: {
            $sum: {
              $cond: [{ $eq: ["$payment_status", "paid"] }, "$total_amount", 0],
            },
          },
        },
      },
    ]),
    Product.countDocuments({ store_id: storeId }),
  ]);

  // 3. Thống kê đơn hàng theo status
  const ordersByStatus = await Order.aggregate([
    { $match: { store_id: storeId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  // 4. Doanh thu và số đơn theo tháng (12 tháng gần nhất)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyStats = await Order.aggregate([
    {
      $match: {
        store_id: storeId,
        created_at: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$created_at" },
          month: { $month: "$created_at" },
        },
        revenue: { $sum: "$total_amount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Backend seller stats không cần monthlyUsers như admin, hoặc nếu cần thì mock/bỏ qua
  // Ở đây FE đang dùng monthlyUsers để vẽ biểu đồ, ta trả về mảng rỗng để tránh crash
  const monthlyUsers = [];

  res.json({
    summary: {
      totalRevenue: orderSummary[0]?.totalRevenue || 0,
      paidRevenue: orderSummary[0]?.paidRevenue || 0,
      totalOrders: orderSummary[0]?.totalOrders || 0,
      totalUsers: 0, // Seller không quản lý user hệ thống
      totalProducts,
    },
    ordersByStatus,
    monthlyStats,
    monthlyUsers,
  });
});


// UC-29: Xác nhận đơn hàng
exports.confirmOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { uuid: req.params.id, status: "created" },
      {
        $set: { status: "confirmed" },
        $push: {
          status_history: {
            oldStatus: "created",
            newStatus: "confirmed",
            changedBy: "seller_test",
            note: "Xác nhận đơn hàng test",
          },
        },
      },
      { new: true },
    );
    if (!order)
      return res
        .status(404)
        .json({
          message:
            "Không tìm thấy đơn hàng hoặc đơn không ở trạng thái 'created'",
        });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UC-30: Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { uuid: req.params.id },
      {
        $set: { status: "cancelled" },
        $push: {
          status_history: {
            oldStatus: "current",
            newStatus: "cancelled",
            changedBy: "seller_test",
            note: req.body.reason || "Hủy đơn test",
          },
        },
      },
      { new: true },
    );
    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UC-32: Cập nhật trạng thái
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    // Lấy order hiện tại để có items (dùng cho sold_count)
    const order = await Order.findOne({ uuid: req.params.id });
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Cập nhật status
    order.status = status;
    order.status_history.push({
      oldStatus: order.status,
      newStatus: status,
      changedBy: "seller_test",
      note: note,
    });
    await order.save();

    // ── Khi giao hàng thành công → tăng sold_count các sản phẩm ──
    if (status === "delivered" && order.items && order.items.length > 0) {
      // Fire-and-forget: không block response
      productService.incrementSoldCount(order.items).catch((err) => {
        console.error("[sold_count] Lỗi khi tăng sold_count:", err.message);
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UC-33 & 35: Lấy toàn bộ đơn hàng (Để test)
exports.getSellerOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
