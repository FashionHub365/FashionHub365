const httpStatus = require('http-status');
const { User, Role, StoreMember, AuditLog } = require('../models');
const ApiError = require('../utils/ApiError');

const createUser = async (userBody) => {
    if (await User.isEmailTaken(userBody.email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    // R2: Centralize Password Hashing
    // userBody should contain 'password' (plain), not 'password_hash'
    if (userBody.password) {
        userBody.password_hash = await require('bcryptjs').hash(userBody.password, 10);
        delete userBody.password;
    }

    return User.create(userBody);
};

const getUserById = async (id) => {
    return User.findById(id).populate('global_role_ids');
};

const getUserByEmail = async (email) => {
    // MUST select password_hash explicitly because it has select:false in schema
    return User.findOne({ email }).select('+password_hash').populate('global_role_ids');
};

const updateUserById = async (userId, updateBody) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    // R2: Centralize Password Hashing for Update
    if (updateBody.password || updateBody.newPassword) {
        const plainPassword = updateBody.password || updateBody.newPassword;
        updateBody.password_hash = await require('bcryptjs').hash(plainPassword, 10);
        updateBody.password_changed_at = new Date();
        delete updateBody.password;
        delete updateBody.newPassword;
    }

    Object.assign(user, updateBody);
    await user.save();
    return user;
};

const assignGlobalRole = async (userId, roleIds, adminId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

    const roles = await Role.find({ _id: { $in: roleIds }, scope: 'GLOBAL' });
    if (roles.length !== roleIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'One or more roles are invalid or not GLOBAL scope');
    }

    const oldRoles = user.global_role_ids;
    user.global_role_ids = roleIds;
    await user.save();

    await AuditLog.create({
        user_id: adminId,
        action: 'ASSIGN_GLOBAL_ROLE',
        target_collection: 'User',
        target_id: user._id,
        old_values: { global_role_ids: oldRoles },
        new_values: { global_role_ids: roleIds },
    });

    return user;
};

const assignStoreRole = async (userId, storeId, roleIds, adminId) => {
    const roles = await Role.find({ _id: { $in: roleIds }, scope: 'STORE' });
    if (roles.length !== roleIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'One or more roles are invalid or not STORE scope');
    }

    let member = await StoreMember.findOne({ user_id: userId, store_id: storeId });
    const oldValues = member ? member.toObject() : null;

    if (!member) {
        member = await StoreMember.create({
            user_id: userId,
            store_id: storeId,
            role_ids: roleIds,
            status: 'ACTIVE',
        });
    } else {
        member.role_ids = roleIds;
        await member.save();
    }

    await AuditLog.create({
        user_id: adminId,
        action: 'ASSIGN_STORE_ROLE',
        target_collection: 'StoreMember',
        target_id: member._id,
        old_values: oldValues,
        new_values: { role_ids: roleIds, store_id: storeId },
    });

    return member;
};

module.exports = {
    createUser,
    getUserById,
    getUserByEmail,
    updateUserById,
    assignGlobalRole,
    assignStoreRole,
};
