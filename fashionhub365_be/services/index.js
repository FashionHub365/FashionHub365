const authService = require('./auth.service');
const userService = require('./user.service');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const cartService = require('./cart.service');
const productService = require('./product.service');
const orderService = require('./order.service');

module.exports = {
    authService,
    userService,
    tokenService,
    emailService,
    cartService,
    productService,
    orderService,
};
