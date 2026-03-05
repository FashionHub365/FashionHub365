// ==========================================
// 1. IMPORTS
// ==========================================
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { Role, Permission } = require('../models');
const { userService } = require('../services');

// ==========================================
// 2. SYSTEM STATS CONTROLLER
// ==========================================
// UC-50: Thống kê hệ thống mở rộng (doanh thu, đơn hàng, user, biểu đồ theo tháng)
const getSystemStats = async (req, res) => {
    try {
        // 1. Tổng quan
        const [orderSummary, totalUsers, totalProducts] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$total_amount' },
                        totalOrders: { $sum: 1 },
                        paidRevenue: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total_amount', 0],
                            },
                        },
                    },
                },
            ]),
            User.countDocuments(),
            Product.countDocuments(),
        ]);

        // 2. Thống kê đơn hàng theo status
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        // 3. Doanh thu và số đơn theo tháng (12 tháng gần nhất)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyStats = await Order.aggregate([
            { $match: { created_at: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$created_at' },
                        month: { $month: '$created_at' },
                    },
                    revenue: { $sum: '$total_amount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // 4. Users đăng ký theo tháng
        const monthlyUsers = await User.aggregate([
            { $match: { created_at: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$created_at' },
                        month: { $month: '$created_at' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        res.json({
            summary: {
                totalRevenue: orderSummary[0]?.totalRevenue || 0,
                paidRevenue: orderSummary[0]?.paidRevenue || 0,
                totalOrders: orderSummary[0]?.totalOrders || 0,
                totalUsers,
                totalProducts,
            },
            ordersByStatus,
            monthlyStats,
            monthlyUsers,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. ROLES & PERMISSIONS CONTROLLERS
// ==========================================
// M1: Consistent response format
const createRole = catchAsync(async (req, res) => {
    if (await Role.findOne({ slug: req.body.slug })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Role already exists');
    }
    const role = await Role.create(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: { role } });
});

const getRoles = catchAsync(async (req, res) => {
    const roles = await Role.find().populate('permission_ids');
    res.send({ success: true, data: { roles } });
});

const createPermission = catchAsync(async (req, res) => {
    if (await Permission.findOne({ code: req.body.code })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Permission already exists');
    }
    const permission = await Permission.create(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: { permission } });
});

const getPermissions = catchAsync(async (req, res) => {
    const permissions = await Permission.find();
    res.send({ success: true, data: { permissions } });
});

const assignGlobalRole = catchAsync(async (req, res) => {
    const user = await userService.assignGlobalRole(req.params.userId, req.body.roleIds, req.user._id);
    res.send({ success: true, data: { user } });
});

const assignStoreRole = catchAsync(async (req, res) => {
    const member = await userService.assignStoreRole(req.params.userId, req.body.storeId, req.body.roleIds, req.user._id);
    res.send({ success: true, data: { member } });
});

// ==========================================
// 4. EXPORTS
// ==========================================
module.exports = {
    getSystemStats,
    createRole,
    getRoles,
    createPermission,
    getPermissions,
    assignGlobalRole,
    assignStoreRole,
};