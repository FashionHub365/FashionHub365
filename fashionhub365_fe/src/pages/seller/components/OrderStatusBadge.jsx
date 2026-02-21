const OrderStatusBadge = ({ status }) => {
    const statusConfig = {
        created: {
            label: 'Chờ xác nhận',
            className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        },
        confirmed: {
            label: 'Đã xác nhận',
            className: 'bg-blue-100 text-blue-800 border-blue-200'
        },
        shipping: {
            label: 'Đang giao',
            className: 'bg-purple-100 text-purple-800 border-purple-200'
        },
        completed: {
            label: 'Hoàn thành',
            className: 'bg-green-100 text-green-800 border-green-200'
        },
        cancelled: {
            label: 'Đã hủy',
            className: 'bg-red-100 text-red-800 border-red-200'
        }
    };

    const config = statusConfig[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
            {config.label}
        </span>
    );
};

export default OrderStatusBadge;