import React, { useEffect, useState, useCallback, useMemo } from "react";
import { adminOverviewService } from "../services/adminOverviewService";
import { format } from "date-fns";
import { ChevronRightIcon, Magnify } from "mdi-material-ui";

const AdminSellerRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [statusFilter, setStatusFilter] = useState("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [tempSearchQuery, setTempSearchQuery] = useState("");

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
    });

    const loadRequests = useCallback(async (page = 1) => {
        setLoading(true);
        setError("");
        try {
            const response = await adminOverviewService.getSellerRequests({
                page,
                limit: pagination.limit,
                status: statusFilter,
                search: searchQuery,
            });

            setRequests(response.sellerRequests || []);
            if (response.meta) {
                setPagination({
                    page: response.meta.page,
                    limit: response.meta.limit,
                    totalItems: response.meta.totalItems,
                    totalPages: response.meta.totalPages,
                });
            }
        } catch (err) {
            setError(err.message || "Failed to load seller requests.");
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, statusFilter, searchQuery]);

    useEffect(() => {
        loadRequests(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, searchQuery]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(tempSearchQuery);
    };

    const handleApprove = async (storeId) => {
        if (!window.confirm("Are you sure you want to approve this store request? The user will be granted Seller access.")) {
            return;
        }

        setError("");
        setSuccess("");
        try {
            await adminOverviewService.approveSellerRequest(storeId);
            setSuccess("Store approved successfully.");
            // Reload current page
            loadRequests(pagination.page);
        } catch (err) {
            setError(err.message || "Failed to approve store.");
        }
    };

    const renderStatusBadge = (store) => {
        if (store.is_draft) {
            return (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                    Pending
                </span>
            );
        }
        if (store.status === 'active') {
            return (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                    Approved
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                {store.status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Seller Requests</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Review and approve store applications from users.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">
                        {success}
                    </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex-1 relative"
                    >
                        <Magnify className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by store name, email or phone..."
                            value={tempSearchQuery}
                            onChange={(e) => setTempSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </form>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="sm:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected / Inactive</option>
                        <option value="">All Requests</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Store Info</th>
                                <th className="px-6 py-4">Owner Contact</th>
                                <th className="px-6 py-4">Submitted At</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                                        <p className="mt-2 text-slate-500">Loading requests...</p>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No requests found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((store) => (
                                    <tr key={store._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{store.name}</div>
                                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">{store.description || "No description provided"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{store.owner_user_id?.email || store.email}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{store.phone || "No phone"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(store.created_at), "MMM d, yyyy")}
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {format(new Date(store.created_at), "h:mm a")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusBadge(store)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {store.is_draft && (
                                                <button
                                                    onClick={() => handleApprove(store._id)}
                                                    className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                        <p className="text-sm text-slate-500">
                            Showing <span className="font-medium text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.totalItems)}</span> of <span className="font-medium text-slate-900">{pagination.totalItems}</span> requests
                        </p>
                        <div className="flex gap-1">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => loadRequests(pagination.page - 1)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => loadRequests(pagination.page + 1)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSellerRequestsPage;
