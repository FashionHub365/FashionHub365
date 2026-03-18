import React, { useState, useEffect, useCallback } from 'react';
import flashSaleApi from '../../../apis/flashSaleApi';
import Swal from 'sweetalert2';

const AdminFlashSalesPage = () => {
    const [flashSales, setFlashSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFlashSale, setEditingFlashSale] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        status: 'upcoming',
        starts_at: '',
        ends_at: ''
    });

    const fetchFlashSales = useCallback(async () => {
        try {
            setLoading(true);
            const res = await flashSaleApi.getFlashSales({
                search: searchQuery,
                status: statusFilter === 'all' ? undefined : statusFilter
            });
            if (res.data?.success) {
                setFlashSales(res.data.data.results || res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load flash sales:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchFlashSales, 300);
        return () => clearTimeout(timer);
    }, [fetchFlashSales]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openModal = (flashSale = null) => {
        if (flashSale) {
            setEditingFlashSale(flashSale);
            setFormData({
                name: flashSale.name,
                status: flashSale.status || 'upcoming',
                starts_at: flashSale.starts_at ? new Date(flashSale.starts_at).toISOString().slice(0, 16) : '',
                ends_at: flashSale.ends_at ? new Date(flashSale.ends_at).toISOString().slice(0, 16) : ''
            });
        } else {
            setEditingFlashSale(null);
            setFormData({
                name: '',
                status: 'upcoming',
                starts_at: '',
                ends_at: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingFlashSale(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFlashSale) {
                await flashSaleApi.updateFlashSale(editingFlashSale._id, formData);
            } else {
                await flashSaleApi.createFlashSale(formData);
            }
            closeModal();
            fetchFlashSales();
            Swal.fire('Success', 'Flash Sale event saved!', 'success');
        } catch (err) {
            Swal.fire('Error', 'Error saving flash sale event.', 'error');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete this event?',
            text: "All associated items will be unlinked.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await flashSaleApi.deleteFlashSale(id);
                fetchFlashSales();
                Swal.fire('Deleted!', 'Event has been deleted.', 'success');
            } catch (err) {
                Swal.fire('Error', 'Error deleting flash sale', 'error');
                console.error(err);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
            case 'upcoming': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-200';
            case 'ended': return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Flash Sales</h1>
                    <p className="text-sm text-slate-500 mt-1">Schedule and manage time-limited high-discount events.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-indigo-100 shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Flash Sale
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ended">Ended</option>
                </select>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Event Name</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Timing</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">Items</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : flashSales.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            </div>
                                            <h3 className="text-slate-900 font-bold">No flash sales</h3>
                                            <p className="text-slate-500 text-sm mt-1">Ready to create some urgency? Add an event!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                flashSales.map((fs) => (
                                    <tr key={fs._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{fs.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-md uppercase tracking-tight ${getStatusColor(fs.status)}`}>
                                                {fs.status || 'upcoming'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="text-slate-600 font-medium">Starts: {new Date(fs.starts_at).toLocaleString('vi-VN')}</div>
                                            <div className="text-slate-400 mt-0.5">Ends: {new Date(fs.ends_at).toLocaleString('vi-VN')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                                                {fs.items?.length || 0} Products
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal(fs)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                <button onClick={() => handleDelete(fs._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingFlashSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
                            </h3>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">&times;</button>
                        </div>
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Event Name</label>
                                    <input
                                        type="text" name="name" value={formData.name} onChange={handleInputChange} required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="E.g., Black Friday Blitz"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                                    <select
                                        name="status" value={formData.status} onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="active">Active</option>
                                        <option value="ended">Ended</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Start Time</label>
                                        <input
                                            type="datetime-local" name="starts_at" value={formData.starts_at} onChange={handleInputChange} required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">End Time</label>
                                        <input
                                            type="datetime-local" name="ends_at" value={formData.ends_at} onChange={handleInputChange} required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-3">
                                    <button type="button" onClick={closeModal} className="flex-1 py-3.5 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all border border-slate-100">Cancel</button>
                                    <button type="submit" className="flex-1 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Save Event</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AdminFlashSalesPage;
