import React, { useState, useEffect, useCallback } from 'react';
import { adminOverviewService } from '../services/adminOverviewService';
import Swal from 'sweetalert2';

const AdminMetadataPage = () => {
    const [activeTab, setActiveTab] = useState('brands');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', slug: '' });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            let result = [];
            const params = { search };
            if (activeTab === 'brands') result = await adminOverviewService.getBrands(params);
            else if (activeTab === 'collections') result = await adminOverviewService.getCollections(params);
            else if (activeTab === 'tags') result = await adminOverviewService.getTags(params);
            setData(result);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeTab, search]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenModal = (item = null) => {
        setEditItem(item);
        setForm(item ? { name: item.name, description: item.description || '', slug: item.slug } : { name: '', description: '', slug: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'brands') {
                if (editItem) await adminOverviewService.updateBrand(editItem._id, form);
                else await adminOverviewService.createBrand(form);
            } else if (activeTab === 'collections') {
                if (editItem) await adminOverviewService.updateCollection(editItem._id, form);
                else await adminOverviewService.createCollection(form);
            } else if (activeTab === 'tags') {
                await adminOverviewService.createTag({ name: form.name });
            }
            setShowModal(false);
            loadData();
            Swal.fire('Success', 'Operation completed', 'success');
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        const res = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (res.isConfirmed) {
            try {
                if (activeTab === 'brands') await adminOverviewService.deleteBrand(id);
                else if (activeTab === 'collections') await adminOverviewService.deleteCollection(id);
                else if (activeTab === 'tags') await adminOverviewService.deleteTag(id);
                loadData();
                Swal.fire('Deleted!', 'Item has been deleted.', 'success');
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    };

    return (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Metadata Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage Brands, Collections, and Tags for products.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-sm"
                >
                    Add New {activeTab.slice(0, -1)}
                </button>
            </div>

            <div className="flex gap-4 mb-6 border-b border-slate-100 pb-px">
                {['brands', 'collections', 'tags'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-bold capitalize transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                    </button>
                ))}
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Slug</th>
                            {activeTab !== 'tags' && <th className="px-6 py-4">Description</th>}
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-10">Loading...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-10 text-slate-400">No items found.</td></tr>
                        ) : data.map((item) => (
                            <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-800">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.slug}</td>
                                {activeTab !== 'tags' && <td className="px-6 py-4 text-sm text-slate-500">{item.description || '-'}</td>}
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {activeTab !== 'tags' && (
                                            <button onClick={() => handleOpenModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        )}
                                        <button onClick={() => handleDelete(item._id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">{editItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Name</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            {activeTab !== 'tags' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-indigo-200 shadow-lg">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMetadataPage;
