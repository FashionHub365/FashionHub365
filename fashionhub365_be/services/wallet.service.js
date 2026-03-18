const httpStatus = require('http-status');
const { Wallet, WalletTransaction, Payout } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get or create wallet for a user
 */
const getOrCreateWallet = async (userId, options = {}) => {
    const { session } = options;
    let wallet = await Wallet.findOne({ user_id: userId }).session(session || null);
    if (!wallet) {
        wallet = await Wallet.create([{ user_id: userId, balance: 0, currency: 'VND' }], { session });
        wallet = wallet[0];
    }
    return wallet;
};

/**
 * Get wallet balance
 */
const getBalance = async (userId) => {
    const wallet = await getOrCreateWallet(userId);
    return { balance: wallet.balance, currency: wallet.currency };
};

/**
 * Deposit money into wallet (e.g., from order payment to seller)
 */
const deposit = async (userId, amount, reference = '', options = {}) => {
    if (amount <= 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Amount must be positive');
    const { session } = options;

    const wallet = await getOrCreateWallet(userId, { session });
    wallet.balance += amount;
    wallet.updated_at = new Date();
    await wallet.save({ session });

    await WalletTransaction.create([{
        wallet_id: wallet._id,
        type: 'deposit',
        amount,
        reference,
    }], { session });

    return wallet;
};

/**
 * Withdraw from wallet
 */
const withdraw = async (userId, amount, reference = '', options = {}) => {
    if (amount <= 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Amount must be positive');
    const { session } = options;

    const wallet = await getOrCreateWallet(userId, { session });
    if (wallet.balance < amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient wallet balance');
    }

    wallet.balance -= amount;
    wallet.updated_at = new Date();
    await wallet.save({ session });

    await WalletTransaction.create([{
        wallet_id: wallet._id,
        type: 'withdraw',
        amount: -amount,
        reference,
    }], { session });

    return wallet;
};

/**
 * Get transaction history
 */
const getTransactions = async (userId, query = {}) => {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const wallet = await getOrCreateWallet(userId);
    const filter = { wallet_id: wallet._id };
    if (type) filter.type = type;

    const [items, total] = await Promise.all([
        WalletTransaction.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        WalletTransaction.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

const requestPayout = async (storeId, amount) => {
    if (amount <= 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Amount must be positive');

    const store = await Store.findById(storeId);
    if (!store) throw new ApiError(httpStatus.NOT_FOUND, 'Store not found');

    const wallet = await getOrCreateWallet(store.owner_user_id);
    if (wallet.balance < amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient wallet balance for this payout request');
    }

    return Payout.create({
        store_id: storeId,
        amount,
        status: 'pending',
    });
};

/**
 * Get payout history for a store
 */
const getPayouts = async (storeId, query = {}) => {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const filter = { store_id: storeId };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
        Payout.find(filter).sort({ requested_at: -1 }).skip(skip).limit(parseInt(limit)),
        Payout.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

const processPayout = async (payoutId, status) => {
    const payout = await Payout.findById(payoutId).populate('store_id');
    if (!payout) throw new ApiError(httpStatus.NOT_FOUND, 'Payout not found');
    if (payout.status !== 'pending') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payout is not in pending status');
    }

    if (!['completed', 'failed', 'processing'].includes(status)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payout status');
    }

    if (status === 'completed') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const store = payout.store_id;
            if (!store) throw new Error('Store association not found');

            // Deduct from wallet
            await withdraw(store.owner_user_id, payout.amount, `Payout completed: ${payout.uuid}`, { session });

            payout.status = 'completed';
            payout.processed_at = new Date();
            await payout.save({ session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } else {
        payout.status = status;
        if (status === 'failed') {
            payout.processed_at = new Date();
        }
        await payout.save();
    }

    return payout;
};

module.exports = {
    getOrCreateWallet,
    getBalance,
    deposit,
    withdraw,
    getTransactions,
    requestPayout,
    getPayouts,
    processPayout,
};
