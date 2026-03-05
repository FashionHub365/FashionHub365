require("dotenv").config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/config');
const connectDB = require('./config/db');
const initDB = require('./script/initDB');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const ApiError = require('./utils/ApiError');
const apiLogger = require('./middleware/apiLogger');


const app = express();


app.use(helmet());

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));


const env = config?.env || process.env.NODE_ENV || 'development';
if (env === 'development') {
    app.use(morgan('dev'));
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(apiLogger);


app.get('/', (req, res) => res.send('FashionHub365 API Running'));


app.use('/api/v1', routes);


app.use((req, res, next) => {
    next(new ApiError(404, 'Not found'));
});


app.use(errorHandler);


const PORT = config?.port || process.env.PORT || 5000;

connectDB()
    .then(() => {
        
        if (typeof initDB === 'function') {
            initDB();
        }

        
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT} in ${env} mode`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to database:", err);
        process.exit(1); 
    });