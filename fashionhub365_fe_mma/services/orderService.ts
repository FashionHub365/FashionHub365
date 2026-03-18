import axiosClient from '../apis/axiosClient';

// Normalize order data
const normalizeOrder = (order: any) => {
  let shippingAddressText = 'No address';
  
  if (typeof order.shipping_address === 'object') {
    shippingAddressText = order.shipping_address?.address_line || [
      order.shipping_address?.province,
      order.shipping_address?.district,
      order.shipping_address?.ward,
    ].filter(Boolean).join(', ') || 'No address';
  } else if (order.shipping_address) {
    shippingAddressText = order.shipping_address;
  }

  return {
    ...order,
    customer_name: order.shipping_address?.full_name || order.shipping_address?.name || 'Customer',
    customer_phone: order.shipping_address?.phone || order.shipping_address?.phone_number || '',
    shipping_address: order.shipping_address,
    shipping_address_text: shippingAddressText,
    items: (order.items || []).map((item: any) => ({
      ...item,
      quantity: item.qty ?? item.quantity ?? 1,
      product_name: item.snapshot?.name || item.snapshot?.product_name || item.productId || 'Product',
      size: item.snapshot?.size || item.variantId || '',
      color: item.snapshot?.color || '',
      price: item.price ?? item.snapshot?.price ?? 0,
    })),
  };
};

// Fetch all seller orders
export const fetchSellerOrders = async () => {
  try {
    const response = await axiosClient.get('/seller/orders/seller/history');
    const data = Array.isArray(response) ? response : [];
    return data.map(normalizeOrder);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Confirm order
export const confirmOrder = async (orderId: string) => {
  try {
    const response = await axiosClient.post(`/seller/orders/${orderId}/confirm`);
    return response;
  } catch (error) {
    console.error('Error confirming order:', error);
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (orderId: string, reason: string) => {
  try {
    const response = await axiosClient.post(`/seller/orders/${orderId}/cancel`, {
      reason
    });
    return response;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: string, note: string) => {
  try {
    const response = await axiosClient.patch(`/seller/orders/${orderId}/status`, {
      status,
      note
    });
    return response;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Get Store Stats
export const getStoreStats = async () => {
  try {
    const response = await axiosClient.get('/seller/orders/stats');
    return response;
  } catch (error) {
    console.error('Error fetching store stats:', error);
    throw error;
  }
};
