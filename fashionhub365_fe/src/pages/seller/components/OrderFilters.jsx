
const OrderFilters = ({ activeFilter, onFilterChange, orders }) => {
    const filters = [
        { id: 'all', label: 'Tất cả', count: orders.length },
        { id: 'created', label: 'Chờ xác nhận', count: orders.filter(o => o.status === 'created').length },
        { id: 'confirmed', label: 'Đã xác nhận', count: orders.filter(o => o.status === 'confirmed').length },
        { id: 'shipping', label: 'Đang giao', count: orders.filter(o => o.status === 'shipping').length },
        { id: 'completed', label: 'Hoàn thành', count: orders.filter(o => o.status === 'completed').length },
        { id: 'cancelled', label: 'Đã hủy', count: orders.filter(o => o.status === 'cancelled').length }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="flex overflow-x-auto">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${activeFilter === filter.id
                            ? 'border-gray-900 text-gray-900 bg-gray-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <span>{filter.label}</span>
                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${activeFilter === filter.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {filter.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default OrderFilters;