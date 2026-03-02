import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Normalize order data từ BE sang format FE cần
const normalizeOrder = (order) => ({
  ...order,
  // Map customer info từ shipping_address hoặc user_id
  customer_name: order.shipping_address?.full_name || order.shipping_address?.name || 'Khách hàng',
  customer_phone: order.shipping_address?.phone || order.shipping_address?.phone_number || '',
  shipping_address: typeof order.shipping_address === 'object'
    ? [
        order.shipping_address?.address,
        order.shipping_address?.district,
        order.shipping_address?.city,
      ].filter(Boolean).join(', ') || 'Không có địa chỉ'
    : order.shipping_address || 'Không có địa chỉ',
  // Map items
  items: (order.items || []).map((item) => ({
    ...item,
    quantity: item.qty ?? item.quantity ?? 1,
    product_name: item.snapshot?.name || item.snapshot?.product_name || item.productId || 'Sản phẩm',
    size: item.snapshot?.size || item.variantId || '',
    color: item.snapshot?.color || '',
    price: item.price ?? item.snapshot?.price ?? 0,
  })),
});

// Fetch all seller orders (UC-33 & 35)
export const fetchSellerOrders = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/seller/history`);
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(normalizeOrder);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Confirm order (UC-29)
export const confirmOrder = async (orderId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/confirm`);
    return response.data;
  } catch (error) {
    console.error('Error confirming order:', error);
    throw error;
  }
};

// Cancel order (UC-30)
export const cancelOrder = async (orderId, reason) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      reason
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

// Update order status (UC-32)
export const updateOrderStatus = async (orderId, status, note) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, {
      status,
      note
    });
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};