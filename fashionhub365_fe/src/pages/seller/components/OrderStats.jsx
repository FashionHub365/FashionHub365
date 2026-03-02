const OrderStats = ({ orders }) => {
    const stats = [
        {
            name: 'Chờ xác nhận',
            value: orders.filter(o => o.status === 'created').length,
            icon: '⏳',
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        },
        {
            name: 'Đã xác nhận',
            value: orders.filter(o => o.status === 'confirmed').length,
            icon: '✓',
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            name: 'Đang giao',
            value: orders.filter(o => o.status === 'shipping').length,
            icon: '🚚',
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            name: 'Hoàn thành',
            value: orders.filter(o => o.status === 'completed').length,
            icon: '✨',
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            name: 'Đã hủy',
            value: orders.filter(o => o.status === 'cancelled').length,
            icon: '✕',
            color: 'bg-red-500',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200'
        }
    ];

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            {stats.map((stat) => (
                <div
                    key={stat.name}
                    className={`${stat.bgColor} overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border ${stat.borderColor}`}
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                                <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                            </div>
                            <div className={`${stat.color} rounded-lg p-3 text-white text-2xl shadow-sm`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OrderStats;