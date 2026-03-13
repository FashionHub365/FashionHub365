const express = require('express');
const authRoute = require('./auth.route');
const adminAuthRoute = require('./adminAuth.route');
const userRoute = require('./user.route');
const userAddressRoute = require('./userAddress.route');
const adminRoute = require('./admin.route');
const orderRoute = require('./order.routes');
const paymentRoute = require('./payment.route');
const paymentMethodRoute = require('./paymentMethod.route');
const productRoute = require('./product.routes');
const uploadRoute = require('./upload.routes');
const vnpayRoute = require('./vnpay.route');
const webhookRoute = require('./webhook.route');
const cartRoute = require('./cart.routes');
const listingRoute = require('./listing.routes');
const customerOrderRoute = require('./customer.order.routes');
const wishlistRoute = require('./wishlist.routes');
const storeRoute = require('./store.route');
const chatRoute = require('./chat.routes');

const router = express.Router();

const defaultRoutes = [
    { path: '/auth', route: authRoute },
    { path: '/admin/auth', route: adminAuthRoute },
    { path: '/users/addresses', route: userAddressRoute },
    { path: '/users', route: userRoute },
    { path: '/admin', route: adminRoute },
    { path: '/seller/orders', route: orderRoute },
    { path: '/payments', route: paymentRoute },
    { path: '/payments/vnpay', route: vnpayRoute },
    { path: '/payment-methods', route: paymentMethodRoute },
    { path: '/products', route: productRoute },
    { path: '/upload', route: uploadRoute },
    { path: '/webhook', route: webhookRoute },
    { path: '/cart', route: cartRoute },
    { path: '/listing', route: listingRoute },
    { path: '/stores', route: storeRoute },
    { path: '/orders', route: customerOrderRoute },
    { path: '/wishlist', route: wishlistRoute },
    { path: '/stores', route: storeRoute },
    { path: '/chat', route: chatRoute },
];


defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
