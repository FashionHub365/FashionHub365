const httpStatus = require('http-status');
const { SystemSetting, FeatureFlag, ActivityLog } = require('../models');
const ApiError = require('../utils/ApiError');

// ---- System Settings ----
const getAllSettings = async () => {
    return SystemSetting.find().sort({ key: 1 });
};

const getSetting = async (key) => {
    const setting = await SystemSetting.findOne({ key });
    return setting;
};

const upsertSetting = async (key, value, scope = 'global') => {
    return SystemSetting.findOneAndUpdate(
        { key },
        { $set: { value, scope, updated_at: new Date() } },
        { upsert: true, new: true }
    );
};

const deleteSetting = async (key) => {
    const result = await SystemSetting.findOneAndDelete({ key });
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
};

// ---- Feature Flags ----
const getAllFlags = async () => {
    return FeatureFlag.find().sort({ key: 1 });
};

const getFlag = async (key) => {
    const flag = await FeatureFlag.findOne({ key });
    return flag?.enabled || false;
};

const upsertFlag = async (key, enabled, description = '') => {
    return FeatureFlag.findOneAndUpdate(
        { key },
        { $set: { enabled, description } },
        { upsert: true, new: true }
    );
};

const deleteFlag = async (key) => {
    const result = await FeatureFlag.findOneAndDelete({ key });
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, 'Feature flag not found');
};

// ---- Activity Logs ----
const logActivity = async (userId, action, context = '') => {
    return ActivityLog.create({ user_id: userId, action, context });
};

const getActivityLogs = async (query = {}) => {
    const { page = 1, limit = 50, userId, action } = query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (userId) filter.user_id = userId;
    if (action) filter.action = { $regex: action, $options: 'i' };

    const [items, total] = await Promise.all([
        ActivityLog.find(filter)
            .populate('user_id', 'display_name email')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        ActivityLog.countDocuments(filter),
    ]);

    return {
        items,
        pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), limit: parseInt(limit) },
    };
};

module.exports = {
    getAllSettings, getSetting, upsertSetting, deleteSetting,
    getAllFlags, getFlag, upsertFlag, deleteFlag,
    logActivity, getActivityLogs,
};
