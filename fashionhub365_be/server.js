require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const initDB = require('./script/initDB');

// Connect to Database
connectDB().then(() => {
    initDB();
});

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes (to be added)
// app.use('/api/users', require('./routes/api/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
