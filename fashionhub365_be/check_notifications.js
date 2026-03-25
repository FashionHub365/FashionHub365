const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/fashionhub365';
        console.log('Connecting...');
        await mongoose.connect(uri);
        console.log('Connected.');

        const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            type: String,
            message: String,
            is_read: { type: Boolean, default: false },
            created_at: { type: Date, default: Date.now }
        }));

        // We don't need User model if we just want to see user_id
        const notifCount = await Notification.countDocuments();

        console.log('Total Notifications:', notifCount);

        if (notifCount > 0) {
            const stats = await Notification.aggregate([
                { $group: { _id: "$type", count: { $sum: 1 } } }
            ]);
            console.log('Types:', JSON.stringify(stats, null, 2));

            const userStats = await Notification.aggregate([
                { $group: { _id: "$user_id", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);
            console.log('Top User IDs:', JSON.stringify(userStats, null, 2));

            const latest = await Notification.find().sort({ created_at: -1 }).limit(5).lean();
            console.log('Latest 5:', JSON.stringify(latest, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
