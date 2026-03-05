// const Order = require("../models/Order");

// // UC-29: Xác nhận đơn hàng
// exports.confirmOrder = async (req, res) => {
//   try {
//     const order = await Order.findOneAndUpdate(
//       { uuid: req.params.id, store_id: req.user.storeId, status: "created" },
//       {
//         $set: { status: "confirmed" },
//         $push: {
//           status_history: {
//             oldStatus: "created",
//             newStatus: "confirmed",
//             changedBy: "seller",
//             note: "Order confirmed",
//           },
//         },
//       },
//       { new: true },
//     );
//     if (!order)
//       return res
//         .status(404)
//         .json({ message: "Không tìm thấy đơn hàng hoặc đơn đã xử lý" });
//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // UC-30: Hủy đơn hàng (Seller)
// exports.cancelOrder = async (req, res) => {
//   try {
//     const order = await Order.findOneAndUpdate(
//       { uuid: req.params.id, store_id: req.user.storeId },
//       {
//         $set: { status: "cancelled" },
//         $push: {
//           status_history: {
//             oldStatus: order.status,
//             newStatus: "cancelled",
//             changedBy: "seller",
//             note: req.body.reason,
//           },
//         },
//       },
//       { new: true },
//     );
//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // UC-32: Cập nhật trạng thái (Giao hàng, Hoàn tất...)
// exports.updateOrderStatus = async (req, res) => {
//   const { status, note } = req.body; // status: 'shipped', 'delivered', etc. [cite: 403]
//   try {
//     const order = await Order.findOne({
//       uuid: req.params.id,
//       store_id: req.user.storeId,
//     });
//     const oldStatus = order.status;
//     order.status = status;
//     order.status_history.push({
//       oldStatus,
//       newStatus: status,
//       changedBy: "seller",
//       note,
//     });
//     await order.save();
//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // UC-33 & 35: Lịch sử đơn hàng & Chi tiết
// exports.getSellerOrderHistory = async (req, res) => {
//   try {
//     const orders = await Order.find({ store_id: req.user.storeId }).sort({
//       created_at: -1,
//     });
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// tạm thời bỏ qua đăng nhập để test api với postman
const Order = require("../models/Order");
const { productService } = require("../services");

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
