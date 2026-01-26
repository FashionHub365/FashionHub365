const connectDB = require('../config/db');
const initDB = require('./initDB');

const run = async () => {
    try {
        await connectDB();
        await initDB();
        console.log('Database and collections are ready.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
