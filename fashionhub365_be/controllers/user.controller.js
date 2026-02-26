const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { User, AuditLog } = require('../models');

const createUser = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(httpStatus.CREATED).send({ success: true, data: { user } });
});

// M4: getUsers with pagination + filter
const getUsers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['status', 'email', 'username']);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (filter.status) query.status = filter.status;
    if (filter.email) query.email = { $regex: filter.email, $options: 'i' };
    if (filter.username) query.username = { $regex: filter.username, $options: 'i' };

    const [users, total] = await Promise.all([
        User.find(query).populate('global_role_ids').skip(skip).limit(limit).sort({ created_at: -1 }),
        User.countDocuments(query),
    ]);

    res.send({
        success: true,
        data: { users },
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});

const getUser = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send({ success: true, data: { user } });
});

const updateUser = catchAsync(async (req, res) => {
    const user = await userService.updateUserById(req.params.userId, req.body);
    res.send({ success: true, data: { user } });
});

// L3: AuditLog when banning/unbanning user
const deleteUser = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const oldStatus = user.status;
    await userService.updateUserById(req.params.userId, { status: 'BANNED' });

    await AuditLog.create({
        user_id: req.user._id,
        action: 'USER_STATUS_CHANGE',
        target_collection: 'User',
        target_id: user._id,
        old_values: { status: oldStatus },
        new_values: { status: 'BANNED' },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

const updateMe = catchAsync(async (req, res) => {
    // Không cho phép user tự update status
    if (req.body.status) {
        delete req.body.status;
    }
    const user = await userService.updateUserById(req.user._id, req.body);
    res.send({ success: true, data: { user } });
});

const deleteMe = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password_hash');
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Yêu cầu xác nhận mật khẩu để vô hiệu hoá tài khoản
    if (!(await user.matchPassword(req.body.password))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect password');
    }

    await userService.updateUserById(user._id, { status: 'INACTIVE' });

    // Revoke current session
    const { Session } = require('../models');
    await Session.updateMany({ user_id: user._id }, { is_revoked: true, revoked_at: new Date() });

    await AuditLog.create({
        user_id: req.user._id,
        action: 'USER_SELF_DEACTIVATE',
        target_collection: 'User',
        target_id: user._id,
        old_values: { status: user.status },
        new_values: { status: 'INACTIVE' },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
    });

    res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe
};
