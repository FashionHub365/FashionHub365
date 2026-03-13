require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function run() {
    await require('./config/db')();
    const ChatSession = require('./models/ChatSession');
    const Store = require('./models/Store');
    
    const sessions = await ChatSession.find().lean();
    const stores = await Store.find().select('name owner_user_id').lean();
    
    fs.writeFileSync('chat_debug.json', JSON.stringify({ sessions, stores }, null, 2), 'utf-8');
    process.exit(0);
}
run();
