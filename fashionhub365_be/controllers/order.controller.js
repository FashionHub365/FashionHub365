const httpStatus = require("http-status");
const mongoose = require("mongoose");
const { runWithTransaction } = require("../utils/transaction");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const stockReservationService = require("../services/stockReservation.service");
const { productService, settlementService } = require("../services");
const outboxService = require("../services/outbox.service");

const STATUS_TRANSITIONS = {
  pending_payment: ["cancelled"],
  created: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const CANCELLABLE_STATUSES = new Set(["pending_payment", "created", "confirmed"]);

const getIdQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: new mongoose.Types.ObjectId(id) };
  }
  return { uuid: id };
};

const normalizeStoreId = (storeId) => {
  if (mongoose.Types.ObjectId.isValid(storeId)) {
    return new mongoose.Types.ObjectId(storeId);
  }
  return storeId;
};

const loadOrderForSeller = async (orderId, storeId, session = null) => {
  const query = {
    ...getIdQuery(orderId),
    store_id: normalizeStoreId(storeId),
  };
  const findQuery = Order.findOne(query);
  if (session) {
    findQuery.session(session);
  }
  return findQuery;
};

const restoreStockForOrder = async (order, session = null) => {
  for (const item of order.items || []) {
    const qty = Number(item.qty || 0);
    if (!item.productId || !item.variantId || qty <= 0) {
      continue;
    }

    await Product.updateOne(
      { _id: item.productId, "variants._id": item.variantId },
      { $inc: { "variants.$.stock": qty } },
      session ? { session } : {}
    );
  }
};

const cancelOrderWithConsistency = async ({ order, reason, actor, session = null }) => {
  if (order.payment_status === "paid") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cannot cancel a paid order");
  }

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot cancel order in status "${order.status}"`);
  }

  const releasedCount = await stockReservationService.releaseReservationsForOrder(order._id, {
    session,
    reason: "SELLER_CANCELLED_ORDER",
    nextStatus: "RELEASED",
  });

  // COD orders deduct stock directly at order creation.
  if (releasedCount === 0 && ["created", "confirmed"].includes(order.status)) {
    await restoreStockForOrder(order, session);
  }

  await Payment.updateMany(
    { order_id: order._id, status: "PENDING" },
    { $set: { status: "CANCELLED", cancelled_at: new Date() } },
    session ? { session } : {}
  );

  await settlementService.cancelSettlementForOrder(order._id, reason || "Order cancelled by seller", { session });

  const oldStatus = order.status;
  order.status = "cancelled";
  order.payment_status = "failed";
  order.status_history.push({
    oldStatus,
    newStatus: "cancelled",
    changedBy: actor,
    note: reason || "Order cancelled by seller",
  });
  await order.save(session ? { session } : {});
  return order;
};

const sendOrderError = (res, error) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return res.status(500).json({ error: error.message });
};

// Seller dashboard stats
exports.getStoreStats = catchAsync(async (req, res) => {
  const storeId = req.storeId;

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

  const ordersByStatus = await Order.aggregate([
    { $match: { store_id: storeId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyStats = await Order.aggregate([
    { $match: { store_id: storeId, created_at: { $gte: twelveMonthsAgo } } },
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

  res.json({
    summary: {
      totalRevenue: orderSummary[0]?.totalRevenue || 0,
      paidRevenue: orderSummary[0]?.paidRevenue || 0,
      totalOrders: orderSummary[0]?.totalOrders || 0,
      totalUsers: 0,
      totalProducts,
    },
    ordersByStatus,
    monthlyStats,
    monthlyUsers: [],
  });
});

// Confirm order
exports.confirmOrder = async (req, res) => {
  try {
    const order = await loadOrderForSeller(req.params.id, req.storeId);
    if (!order || order.status !== "created") {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "Order not found or not in created status" });
    }

    order.status = "confirmed";
    order.status_history.push({
      oldStatus: "created",
      newStatus: "confirmed",
      changedBy: req.user?._id?.toString() || "seller",
      note: req.body?.note || "Order confirmed by seller",
    });
    await order.save();

    if (order.payment_status === "paid") {
      await settlementService.createSettlementForPaidOrder(order._id);
    }

    // Notify customer
    await outboxService.enqueueEvent({
      aggregateType: 'ORDER',
      aggregateId: order._id.toString(),
      eventType: 'ORDER_STATUS_CHANGED',
      payload: {
        orderId: order._id.toString(),
        orderUuid: order.uuid,
        userId: order.user_id.toString(),
        oldStatus: 'created',
        newStatus: 'confirmed',
        changedBy: 'seller',
      },
    });

    res.json(order);
  } catch (error) {
    sendOrderError(res, error);
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const result = await runWithTransaction(async (session) => {
      const current = await loadOrderForSeller(req.params.id, req.storeId, session);
      if (!current) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
      }
      return cancelOrderWithConsistency({
        order: current,
        reason: req.body?.reason,
        actor: req.user?._id?.toString() || "seller",
        session,
      });
    });

    // Notify customer
    const latestStatusChange = result.status_history?.[result.status_history.length - 1];
    await outboxService.enqueueEvent({
      aggregateType: 'ORDER',
      aggregateId: result._id.toString(),
      eventType: 'ORDER_STATUS_CHANGED',
      payload: {
        orderId: result._id.toString(),
        orderUuid: result.uuid,
        userId: result.user_id.toString(),
        oldStatus: latestStatusChange?.oldStatus || 'created',
        newStatus: 'cancelled',
        changedBy: 'seller',
      },
    });

    res.json(result);
  } catch (error) {
    sendOrderError(res, error);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const nextStatus = `${req.body?.status || ""}`.trim().toLowerCase();
    const note = req.body?.note;

    if (!nextStatus) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Status is required");
    }
    if (!Object.keys(STATUS_TRANSITIONS).includes(nextStatus)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Invalid status: ${nextStatus}`);
    }

    const result = await runWithTransaction(async (session) => {
      const current = await loadOrderForSeller(req.params.id, req.storeId, session);
      if (!current) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
      }

      if (nextStatus === "cancelled") {
        const oldStatus = current.status;
        const cancelledOrder = await cancelOrderWithConsistency({
          order: current,
          reason: note,
          actor: req.user?._id?.toString() || "seller",
          session,
        });
        return {
          order: cancelledOrder,
          oldStatus,
          newStatus: "cancelled",
        };
      }

      const allowedNext = STATUS_TRANSITIONS[current.status] || [];
      if (!allowedNext.includes(nextStatus)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid transition: ${current.status} -> ${nextStatus}`
        );
      }

      const oldStatus = current.status;
      current.status = nextStatus;
      current.status_history.push({
        oldStatus,
        newStatus: nextStatus,
        changedBy: req.user?._id?.toString() || "seller",
        note: note || "Order status updated by seller",
      });
      if (nextStatus === "delivered" && current.payment_method === "cod") {
        current.payment_status = "paid";
      }
      await current.save(session ? { session } : {});

      if (nextStatus === "confirmed" && current.payment_status === "paid") {
        await settlementService.createSettlementForPaidOrder(current._id, null, { session });
      }

      if (nextStatus === "delivered" && current.payment_status === "paid") {
        await settlementService.createSettlementForPaidOrder(current._id, null, { session });
        await settlementService.releaseSettlementToWallet(current._id, { session });
      }

      return { order: current, oldStatus, newStatus: nextStatus };
    });

    // Notify customer
    await outboxService.enqueueEvent({
      aggregateType: 'ORDER',
      aggregateId: result.order._id.toString(),
      eventType: 'ORDER_STATUS_CHANGED',
      payload: {
        orderId: result.order._id.toString(),
        orderUuid: result.order.uuid,
        userId: result.order.user_id.toString(),
        oldStatus: result.oldStatus,
        newStatus: result.newStatus,
        changedBy: 'seller',
      },
    });

    if (result.newStatus === "delivered" && result.order.items && result.order.items.length > 0) {
      productService.incrementSoldCount(result.order.items).catch((err) => {
        console.error("[sold_count]", err.message);
      });
    }

    res.json(result.order);
  } catch (error) {
    sendOrderError(res, error);
  }
};

// Seller order history
exports.getSellerOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { store_id: req.storeId };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      items: orders,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
