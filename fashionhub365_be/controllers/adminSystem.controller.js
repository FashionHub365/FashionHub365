const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Order, User, Product, AuditLog, Category, Role, StoreMember, Settlement } = require('../models');
const { buildSort, buildPaginationMeta, ensurePrivilegedAdminActor } = require('./adminUtils');
const platformLedgerService = require('../services/platformLedger.service');

const getSystemStats = catchAsync(async (req, res) => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [orderSummary, settlementSummary, platformSummary, totalUsers, totalProducts, recentOrdersRaw] = await Promise.all([
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
        Settlement.aggregate([
            {
                $match: {
                    status: { $in: ['pending', 'available'] },
                },
            },
            {
                $group: {
                    _id: null,
                    platformRevenue: { $sum: '$platform_fee_amount' },
                    sellerPayablePending: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'pending'] }, '$net_amount', 0],
                        },
                    },
                    sellerReleased: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'available'] }, '$net_amount', 0],
                        },
                    },
                },
            },
        ]),
        platformLedgerService.getPlatformLedgerSummary(),
        User.countDocuments(),
        Product.countDocuments(),
        Order.find()
            .sort({ created_at: -1 })
            .limit(5)
            .populate('user_id', 'profile.full_name username email'),
    ]);

    // Calculate trends (Current Month vs Last Month)
    const [currentMonthData, lastMonthData, currentMonthPlatformLedger, lastMonthPlatformLedger] = await Promise.all([
        Order.aggregate([
            { $match: { created_at: { $gte: currentMonthStart } } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$total_amount' },
                    orders: { $sum: 1 },
                },
            },
        ]),
        Order.aggregate([
            { $match: { created_at: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$total_amount' },
                    orders: { $sum: 1 },
                },
            },
        ]),
        platformLedgerService.getPlatformLedgerSummary({ from: currentMonthStart }),
        platformLedgerService.getPlatformLedgerSummary({ from: lastMonthStart, to: lastMonthEnd }),
    ]);

    const [currentMonthUsers, lastMonthUsers] = await Promise.all([
        User.countDocuments({ created_at: { $gte: currentMonthStart } }),
        User.countDocuments({ created_at: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
    ]);

    const calculateGrowth = (current, previous) => {
        if (!previous || previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const trend = {
        revenue: calculateGrowth(currentMonthData[0]?.revenue || 0, lastMonthData[0]?.revenue || 0),
        orders: calculateGrowth(currentMonthData[0]?.orders || 0, lastMonthData[0]?.orders || 0),
        users: calculateGrowth(currentMonthUsers, lastMonthUsers),
        platformRevenue: calculateGrowth(
            currentMonthPlatformLedger?.netRevenue || 0,
            lastMonthPlatformLedger?.netRevenue || 0
        ),
    };

    const recentOrderIds = recentOrdersRaw.map((order) => order._id);
    const recentSettlements = await Settlement.find({ order_id: { $in: recentOrderIds } })
        .select('order_id platform_fee_amount net_amount status');
    const settlementMap = new Map(
        recentSettlements.map((settlement) => [settlement.order_id.toString(), settlement])
    );

    const recentOrders = recentOrdersRaw.map(order => ({
        id: order._id,
        orderNumber: order.order_number || `#ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customer: order.user_id?.profile?.full_name || order.user_id?.username || 'Guest',
        initials: (order.user_id?.profile?.full_name || order.user_id?.username || 'G').charAt(0).toUpperCase(),
        total: order.total_amount,
        platformFee: settlementMap.get(order._id.toString())?.platform_fee_amount || 0,
        sellerNet: settlementMap.get(order._id.toString())?.net_amount || 0,
        settlementStatus: settlementMap.get(order._id.toString())?.status || null,
        status: order.status.toUpperCase(),
        time: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }));

    const ordersByStatus = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

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

    const monthlyPlatformStats = await platformLedgerService.getMonthlyPlatformLedgerSummary({
        from: twelveMonthsAgo,
    });

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

    res.send({
        success: true,
        data: {
            summary: {
                totalRevenue: orderSummary[0]?.totalRevenue || 0,
                paidRevenue: orderSummary[0]?.paidRevenue || 0,
                platformRevenue: platformSummary?.netRevenue || 0,
                platformRevenueRecognized: platformSummary?.recognizedRevenue || 0,
                platformRevenueReversed: platformSummary?.reversedRevenue || 0,
                sellerPayablePending: settlementSummary[0]?.sellerPayablePending || 0,
                sellerReleased: settlementSummary[0]?.sellerReleased || 0,
                totalOrders: orderSummary[0]?.totalOrders || 0,
                totalUsers,
                totalProducts,
            },
            trend,
            recentOrders,
            ordersByStatus,
            monthlyStats,
            monthlyPlatformStats,
            monthlyUsers,
        },
    });
});

const getAuditLogs = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        userId,
        action,
        targetCollection,
        targetId,
        search,
        from,
        to,
        sortBy = 'created_at',
        order = 'desc',
    } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (userId) query.user_id = userId;
    if (action) query.action = { $regex: action, $options: 'i' };
    if (targetCollection) query.target_collection = targetCollection;
    if (targetId) query.target_id = targetId;
    if (from || to) {
        query.created_at = {};
        if (from) query.created_at.$gte = new Date(from);
        if (to) query.created_at.$lte = new Date(to);
    }
    if (search) {
        query.$or = [
            { action: { $regex: search, $options: 'i' } },
            { target_collection: { $regex: search, $options: 'i' } },
            { ip_address: { $regex: search, $options: 'i' } },
            { user_agent: { $regex: search, $options: 'i' } },
        ];
    }

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .populate('user_id', 'email username profile.full_name')
            .sort(buildSort(sortBy, order))
            .skip(skip)
            .limit(limit),
        AuditLog.countDocuments(query),
    ]);

    res.send({
        success: true,
        data: { auditLogs: logs },
        meta: buildPaginationMeta(page, limit, total),
    });
});

const getAuditLogById = catchAsync(async (req, res) => {
    const log = await AuditLog.findById(req.params.id).populate('user_id', 'email username profile.full_name');
    if (!log) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Audit log not found');
    }
    res.send({ success: true, data: { auditLog: log } });
});

const getAdminEnums = catchAsync(async (req, res) => {
    const userStatuses = User.schema.path('status').enumValues;
    const roleScopes = Role.schema.path('scope').enumValues;
    const storeMemberStatuses = StoreMember.schema.path('status').enumValues;

    res.send({
        success: true,
        data: {
            userStatuses,
            roleScopes,
            storeMemberStatuses,
        },
    });
});

const getCategoryOptions = catchAsync(async (req, res) => {
    const includeDeleted = String(req.query.includeDeleted).toLowerCase() === 'true';
    const query = includeDeleted ? {} : { deleted_at: null };
    const categories = await Category.find(query)
        .select('_id name slug parent_id deleted_at')
        .sort({ name: 1 });
    res.send({ success: true, data: { categories } });
});

module.exports = {
    getSystemStats,
    getAuditLogs,
    getAuditLogById,
    getAdminEnums,
    getCategoryOptions,
};
