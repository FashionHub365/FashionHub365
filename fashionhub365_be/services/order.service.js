const httpStatus = require('http-status');
const { Cart, Order, Product } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Tạo đơn hàng từ giỏ hàng của user
 * - Lấy toàn bộ items trong Cart
 * - Validate stock cho từng item
 * - Tạo Order document với snapshot sản phẩm (giá tại thời điểm mua)
 * - Trừ tồn kho
 * - Xoá giỏ hàng sau khi đặt thành công
 */
const createOrderFromCart = async (userId, { shipping_address, payment_method = 'cod', note }) => {
    // 1. Lấy giỏ hàng kèm dữ liệu sản phẩm
    const cart = await Cart.findOne({ user_id: userId }).populate({
        path: 'items.productId',
        select: 'name media base_price variants store_id',
    });

    if (!cart || cart.items.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Giỏ hàng trống. Không thể tạo đơn hàng.');
    }

    // 2. Build order items & validate stock
    let totalAmount = 0;
    const shippingFee = totalAmount >= 1000000 ? 0 : 30000;

    const orderItemsByStore = {}; // Group by store_id

    for (const cartItem of cart.items) {
        const product = cartItem.productId;
        if (!product) continue;

        const variant = product.variants.find(v => v._id.toString() === cartItem.variantId.toString());
        if (!variant) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Biến thể sản phẩm "${product.name}" không tồn tại.`);
        }
        if (variant.stock < cartItem.quantity) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Sản phẩm "${product.name}" (${variant.variantName || ''}) chỉ còn ${variant.stock} sản phẩm.`
            );
        }

        const price = variant.price || product.base_price;
        const subtotal = price * cartItem.quantity;
        totalAmount += subtotal;

        const storeId = product.store_id?.toString();
        if (!storeId) continue;

        if (!orderItemsByStore[storeId]) {
            orderItemsByStore[storeId] = [];
        }

        orderItemsByStore[storeId].push({
            productId: product._id,
            variantId: cartItem.variantId,
            qty: cartItem.quantity,
            price,
            subtotal,
            snapshot: {
                name: product.name,
                variantName: variant.variantName || '',
                attributes: variant.attributes || {},
                image: product.media?.find(m => m.isPrimary)?.url || product.media?.[0]?.url || '',
            }
        });
    }

    if (Object.keys(orderItemsByStore).length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Không có sản phẩm hợp lệ trong giỏ hàng.');
    }

    const calculatedShippingFee = totalAmount >= 1000000 ? 0 : 30000;
    const grandTotal = totalAmount + calculatedShippingFee;

    // 3. Tạo Order (1 order per store – chuẩn thương mại điện tử)
    const orders = [];
    for (const [storeId, items] of Object.entries(orderItemsByStore)) {
        const storeTotal = items.reduce((sum, i) => sum + i.subtotal, 0);
        const storeFee = storeTotal >= 1000000 ? 0 : 30000;

        const order = await Order.create({
            user_id: userId,
            store_id: storeId,
            shipping_address,
            items,
            total_amount: storeTotal + storeFee,
            shipping_fee: storeFee,
            payment_status: 'unpaid',
            status: 'created',
            status_history: [{
                oldStatus: null,
                newStatus: 'created',
                changedBy: 'customer',
                note: note || 'Đơn hàng được tạo bởi khách hàng',
            }]
        });
        orders.push(order);
    }

    // 4. Trừ tồn kho
    for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.productId);
        if (!product) continue;
        const variant = product.variants.find(v => v._id.toString() === cartItem.variantId.toString());
        if (variant) {
            variant.stock -= cartItem.quantity;
            await product.save();
        }
    }

    // 5. Xoá giỏ hàng
    cart.items = [];
    await cart.save();

    return {
        orders,
        totalAmount: grandTotal,
        itemCount: cart.items.length,
    };
};

/**
 * Lấy danh sách đơn hàng của user (customer)
 */
const getMyOrders = async (userId) => {
    const orders = await Order.find({ user_id: userId })
        .sort({ created_at: -1 })
        .populate('store_id', 'name');

    return orders.map(order => ({
        id: order._id,
        uuid: order.uuid,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        shipping_fee: order.shipping_fee,
        shipping_address: order.shipping_address,
        store_name: order.store_id?.name || 'Unknown Store',
        items: order.items,
        created_at: order.created_at,
    }));
};

module.exports = {
    createOrderFromCart,
    getMyOrders,
};
