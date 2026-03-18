import React, { useState, useEffect, useCallback } from 'react';
import campaignApi from '../../../apis/campaignApi';
import Swal from 'sweetalert2';

const AdminCampaignsPage = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'draft',
        banner_url: '',
        starts_at: '',
        ends_at: ''
    });

    const fetchCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            const res = await campaignApi.getCampaigns({
                search: searchQuery,
                status: statusFilter === 'all' ? undefined : statusFilter
            });
            if (res.data?.success) {
                setCampaigns(res.data.data.results || res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load campaigns:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchCampaigns, 300);
        return () => clearTimeout(timer);
    }, [fetchCampaigns]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openModal = (campaign = null) => {
        if (campaign) {
            setEditingCampaign(campaign);
            setFormData({
                name: campaign.name,
                description: campaign.description || '',
                status: campaign.status || 'draft',
                banner_url: campaign.banner_url || '',
                starts_at: campaign.starts_at ? new Date(campaign.starts_at).toISOString().split('T')[0] : '',
                ends_at: campaign.ends_at ? new Date(campaign.ends_at).toISOString().split('T')[0] : ''
            });
        } else {
            setEditingCampaign(null);
            setFormData({
                name: '',
                description: '',
                status: 'draft',
                banner_url: '',
                starts_at: '',
                ends_at: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCampaign(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCampaign) {
                await campaignApi.updateCampaign(editingCampaign._id, formData);
            } else {
                await campaignApi.createCampaign(formData);
            }
            closeModal();
            fetchCampaigns();
            Swal.fire('Success', 'Campaign saved successfully!', 'success');
        } catch (err) {
            Swal.fire('Error', 'Error saving campaign.', 'error');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await campaignApi.deleteCampaign(id);
                fetchCampaigns();
                Swal.fire('Deleted!', 'Campaign has been deleted.', 'success');
            } catch (err) {
                Swal.fire('Error', 'Error deleting campaign', 'error');
                console.error(err);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
            case 'draft': return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
            case 'ended': return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <section className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Campaign Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Organize and manage marketing campaigns and banners.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-indigo-100 shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Campaign
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Search campaigns..."
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
                    <option value="draft">Draft</option>
                    <option value="ended">Ended</option>
                </select>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Campaign Details</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Banner</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Timeline</th>
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
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            </div>
                                            <h3 className="text-slate-900 font-bold">No campaigns found</h3>
                                            <p className="text-slate-500 text-sm mt-1">Start by creating your first marketing campaign!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => (
                                    <tr key={campaign._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 line-clamp-1">{campaign.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{campaign.description || 'No description provided'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium">
                                            {campaign.banner_url ? (
                                                <a href={campaign.banner_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    Preview
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 italic">No banner</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-md uppercase tracking-tight ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="text-slate-600 font-medium">{new Date(campaign.starts_at).toLocaleDateString('vi-VN')}</div>
                                            <div className="text-slate-400 mt-0.5">to {new Date(campaign.ends_at).toLocaleDateString('vi-VN')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal(campaign)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                <button onClick={() => handleDelete(campaign._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Fill in the details for your marketing campaign.</p>
                            </div>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">&times;</button>
                        </div>
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Campaign Name</label>
                                        <input
                                            type="text" name="name" value={formData.name} onChange={handleInputChange} required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Summer Sale 2026"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                                        <textarea
                                            name="description" value={formData.description} onChange={handleInputChange} rows={2}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                                            placeholder="Write a brief description..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                                        <select
                                            name="status" value={formData.status} onChange={handleInputChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="active">Active</option>
                                            <option value="ended">Ended</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Banner Image URL</label>
                                        <input
                                            type="text" name="banner_url" value={formData.banner_url} onChange={handleInputChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="https://images.unsplash.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                                        <input
                                            type="date" name="starts_at" value={formData.starts_at} onChange={handleInputChange} required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                                        <input
                                            type="date" name="ends_at" value={formData.ends_at} onChange={handleInputChange} required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        type="button" onClick={closeModal}
                                        className="flex-1 py-3.5 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all border border-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                    >
                                        {editingCampaign ? 'Update Campaign' : 'Publish Campaign'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AdminCampaignsPage;
