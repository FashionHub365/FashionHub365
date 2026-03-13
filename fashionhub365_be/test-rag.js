const path = require('path');
const config = require('./config/config');
const mongoose = require('mongoose');
const aiService = require('./services/ai.service');

const testRAG = async () => {
    try {
        console.log('Connecting to MongoDB using app config...');
        await mongoose.connect(config.mongoose.url);
        console.log('Connected to:', mongoose.connection.host);

        const prompt = "Shop mình có sản phẩm nào không?";
        console.log(`\nTesting RAG with prompt: "${prompt}"`);

        const response = await aiService.generateResponse(prompt, []);

        console.log('\n--- AI RESPONSE ---');
        console.log(response);
        console.log('-------------------\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n!!! TEST FAILED !!!');
        console.error(error);
        process.exit(1);
    }
};

testRAG();
