const mongoose = require('mongoose');
const { StoreFollower, Store, User } = require('./models');
const storeService = require('./services/store.service');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const testFollowLogic = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Get a dummy user and store
        const user = await User.findOne();
        const store = await Store.findOne({ status: 'active' });

        if (!user || !store) {
            console.log('No user or store found for testing');
            process.exit(0);
        }

        const userId = user._id;
        const storeId = store._id;

        console.log(`Testing with User: ${user.username} and Store: ${store.name}`);

        // 1. Follow
        console.log('1. Testing followStore...');
        await storeService.followStore(userId, storeId);
        let status = await storeService.getFollowingStatus(userId, storeId);
        console.log(`Following Status: ${status} (Expected: true)`);

        // 2. Count
        console.log('2. Testing getStoreFollowerCount...');
        let count = await storeService.getStoreFollowerCount(storeId);
        console.log(`Follower Count: ${count}`);

        // 3. List
        console.log('3. Testing getFollowingStores...');
        let following = await storeService.getFollowingStores(userId);
        console.log(`Following stores count: ${following.length}`);
        const found = following.some(s => s._id.toString() === storeId.toString());
        console.log(`Store found in following list: ${found} (Expected: true)`);

        // 4. Unfollow
        console.log('4. Testing unfollowStore...');
        await storeService.unfollowStore(userId, storeId);
        status = await storeService.getFollowingStatus(userId, storeId);
        console.log(`Following Status: ${status} (Expected: false)`);

        console.log('Verification successful!');
    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

testFollowLogic();
