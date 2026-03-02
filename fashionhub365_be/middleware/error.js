const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    // Gap 3: Convert Mongoose errors to operational errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }
    if (err.code === 11000) {
        // Duplicate key error
        statusCode = 409;
        const field = Object.keys(err.keyValue || {}).join(', ');
        message = `Duplicate value for: ${field}`;
    }
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    if (!err.isOperational) {
        statusCode = statusCode || 500;
        message = statusCode === 500 ? 'Internal Server Error' : message;
    }

    const response = {
        success: false,
        error: {
            code: statusCode,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    };

    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    res.status(statusCode).send(response);
};

module.exports = errorHandler;
