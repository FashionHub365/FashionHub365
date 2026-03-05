const mongoose = require('mongoose');
const models = require('../models');

const initDB = async () => {
    try {
        console.log('Initializing database collections...');
        // Mongoose creates collections automatically when data is inserted, 
        // but we can force it by calling createCollection or just listing them.

        for (const modelName in models) {
            await models[modelName].init();
            console.log(`- Model ${modelName} initialized.`);
        }

        console.log('All collections initialized successfully.');
    } catch (err) {
        console.error(`Database Init Error: ${err.message}`);
    }
};

module.exports = initDB;
