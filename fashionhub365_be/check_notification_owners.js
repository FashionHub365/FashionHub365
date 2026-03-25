const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/fashionhub365';
        await mongoose.connect(uri);

        const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            type: String,
            message: String
        }));

        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
            email: String,
            username: String,
            role: String || [String]
        }));

        const distinctUserIds = await Notification.distinct('user_id');
        console.log('--- USER OWNERSHIP DIAGNOSTICS ---');
        console.log('Distinct User IDs with notifications:', distinctUserIds.length);

        const users = await User.find({ _id: { $in: distinctUserIds } }).select('email username role').lean();
        console.log('Users found matching notification IDs:', users.length);

        users.forEach(u => {
            console.log(`User: ${u.username || u.email} (${u._id}) - Role: ${u.role}`);
        });

        const orphanCount = distinctUserIds.length - users.length;
        console.log('Orphaned notifications (user not found):', orphanCount);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
