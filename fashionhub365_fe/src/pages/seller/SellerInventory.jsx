import React, { useState, useEffect } from 'react';
import inventoryApi from '../../apis/inventoryApi';
import { showSuccess, showError } from '../../utils/swalUtils';

const SellerInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adjustingId, setAdjustingId] = useState(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState(0);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getInventory();
            if (response.data && response.data.success) {
                setInventory(response.data.data.items);
            }
        } catch (err) {
            setError('Failed to load inventory data');
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleAdjust = async (id) => {
        if (!adjustmentAmount || isNaN(adjustmentAmount)) return;

        try {
            await inventoryApi.adjustInventory(id, Number(adjustmentAmount));
            showSuccess('Đã cập nhật số lượng tồn kho thành công!');
            setAdjustingId(null);
            setAdjustmentAmount(0);
            fetchInventory(); // Reload data
        } catch (err) {
            showError('Lỗi khi cập nhật kho hàng: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading inventory data...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage stock levels for your products</p>
                </div>
                <button
                    onClick={fetchInventory}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {inventory.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Variant</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.product_id?.name || 'Unknown Product'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{item.variant_id?.sku || 'N/A'}</div>
                                        {item.variant_id?.attributes && (
                                            <div className="text-xs text-gray-400">
                                                {item.variant_id.attributes.map(a => `${a.k}: ${a.v}`).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        {item.quantity - (item.reserved_quantity || 0)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {item.reserved_quantity || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${(item.quantity - (item.reserved_quantity || 0)) <= (item.low_stock_threshold || 5)
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {(item.quantity - (item.reserved_quantity || 0)) <= (item.low_stock_threshold || 5) ? 'Low Stock' : 'In Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {adjustingId === item._id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <input
                                                    type="number"
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                                    placeholder="+/-"
                                                    value={adjustmentAmount}
                                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                                />
                                                <button onClick={() => handleAdjust(item._id)} className="text-indigo-600 hover:text-indigo-900">Save</button>
                                                <button onClick={() => setAdjustingId(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAdjustingId(item._id)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                                            >
                                                Adjust Stock
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SellerInventory;
