const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const adminRoute = require('./admin.route');
const orderRoute = require('./order.routes');
const productRoute = require('./product.routes');
const uploadRoute = require('./upload.routes');
const cartRoute = require('./cart.routes');

const router = express.Router();

const defaultRoutes = [
    { path: '/auth', route: authRoute },
    { path: '/users', route: userRoute },
    { path: '/admin', route: adminRoute },
    { path: '/orders', route: orderRoute },
    { path: '/products', route: productRoute },
    { path: '/upload', route: uploadRoute },
    { path: '/cart', route: cartRoute },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
