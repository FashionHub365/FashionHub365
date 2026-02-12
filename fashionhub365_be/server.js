const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const ApiError = require('./utils/ApiError');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors());

// Logging
if (config.env === 'development') {
    app.use(morgan('dev'));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => res.send('FashionHub365 API Running'));

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res, next) => {
    next(new ApiError(404, 'Not found'));
});

// Global error handler
app.use(errorHandler);

// Connect DB & Start server
connectDB().then(() => {
    app.listen(config.port, () => {
        console.log(`Server started on port ${config.port} in ${config.env} mode`);
    });
});
