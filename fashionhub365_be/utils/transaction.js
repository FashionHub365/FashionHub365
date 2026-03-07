const mongoose = require('mongoose');

const isTransactionUnsupported = (error) => {
    const message = `${error?.message || ''}`.toLowerCase();
    return (
        message.includes('transaction numbers are only allowed on a replica set member or mongos') ||
        message.includes('replica set') ||
        message.includes('transaction')
    );
};

const runWithTransaction = async (work, { fallbackWithoutTransaction = true } = {}) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const result = await work(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        try {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
        } catch (abortError) {
            // no-op
        }

        if (fallbackWithoutTransaction && isTransactionUnsupported(error)) {
            return work(null);
        }
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = {
    runWithTransaction,
};
