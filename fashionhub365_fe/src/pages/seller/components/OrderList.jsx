import OrderCard from "./OrderCard";

const OrderList = ({ orders, onOrderUpdate }) => {
    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn hàng</h3>
                <p className="text-gray-500">Chưa có đơn hàng nào trong danh mục này</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
                <OrderCard key={order.uuid} order={order} onOrderUpdate={onOrderUpdate} />
            ))}
        </div>
    );
};

export default OrderList;