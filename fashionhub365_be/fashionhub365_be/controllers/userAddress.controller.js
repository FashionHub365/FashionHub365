const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { UserAddress, Order } = require('../models');

const getActiveAddress = async (userId, uuid) => {
    const address = await UserAddress.findOne({ user_id: userId, uuid, deleted_at: null });
    if (!address) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Address not found');
    }
    return address;
};

const ensureSingleDefault = async (userId, addressId) => {
    await UserAddress.updateMany(
        { user_id: userId, deleted_at: null, _id: { $ne: addressId } },
        { is_default: false }
    );
};

const ensureAnyDefault = async (userId) => {
    const hasDefault = await UserAddress.findOne({ user_id: userId, deleted_at: null, is_default: true });
    if (hasDefault) {
        return;
    }

    const fallbackAddress = await UserAddress.findOne({ user_id: userId, deleted_at: null }).sort({ created_at: 1 });
    if (fallbackAddress) {
        fallbackAddress.is_default = true;
        await fallbackAddress.save();
    }
};

const createAddress = catchAsync(async (req, res) => {
    const existingCount = await UserAddress.countDocuments({ user_id: req.user._id, deleted_at: null });
    const shouldBeDefault = existingCount === 0 || req.body.is_default === true;

    const address = await UserAddress.create({
        ...req.body,
        user_id: req.user._id,
        is_default: shouldBeDefault,
    });

    if (shouldBeDefault) {
        await ensureSingleDefault(req.user._id, address._id);
    }

    res.status(httpStatus.CREATED).send({ success: true, data: { address } });
});

const listAddresses = catchAsync(async (req, res) => {
    const addresses = await UserAddress.find({ user_id: req.user._id, deleted_at: null }).sort({ is_default: -1, created_at: -1 });
    res.send({ success: true, data: { addresses } });
});

const getAddress = catchAsync(async (req, res) => {
    const address = await getActiveAddress(req.user._id, req.params.uuid);
    res.send({ success: true, data: { address } });
});

const updateAddress = catchAsync(async (req, res) => {
    const address = await getActiveAddress(req.user._id, req.params.uuid);
    Object.assign(address, req.body);

    if (req.body.is_default === true) {
        address.is_default = true;
    }

    await address.save();

    if (address.is_default) {
        await ensureSingleDefault(req.user._id, address._id);
    }

    res.send({ success: true, data: { address } });
});

const setDefaultAddress = catchAsync(async (req, res) => {
    const address = await getActiveAddress(req.user._id, req.params.uuid);
    address.is_default = true;
    await address.save();
    await ensureSingleDefault(req.user._id, address._id);
    res.send({ success: true, data: { address } });
});

const deleteAddress = catchAsync(async (req, res) => {
    const address = await getActiveAddress(req.user._id, req.params.uuid);

    const blockingOrder = await Order.findOne({
        user_id: req.user._id,
        status: { $in: ['created', 'confirmed'] },
        'shipping_address.uuid': address.uuid,
    });

    if (blockingOrder) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete address that is attached to a pending order');
    }

    address.deleted_at = new Date();
    address.is_default = false;
    await address.save();
    await ensureAnyDefault(req.user._id);

    res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
    createAddress,
    listAddresses,
    getAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
};
