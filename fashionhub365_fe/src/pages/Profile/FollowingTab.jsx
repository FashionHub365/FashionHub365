import React from "react";

const FollowingTab = ({ stores, loading, currentPage, totalPages, onPageChange, onUnfollow, onOpenShop }) => {
    if (loading) return <div className="py-16 text-center text-sm text-gray-500">Loading followed shops...</div>;
    if (!stores.length) return <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">You are not following any shops yet.</div>;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                {stores.map((shop) => (
                    <article key={shop._id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:shadow-md">
                        <div className="flex items-center gap-4 p-4">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-50">
                                <img src={shop.profile?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name || shop.display_name)}&background=f3f4f6&color=6b7280`} alt={shop.name || shop.display_name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="truncate text-sm font-bold text-gray-900 group-hover:text-gray-700 cursor-pointer" onClick={() => onOpenShop(shop._id)}>
                                    {shop.name || shop.display_name}
                                </h4>
                                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Active Shop
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => onOpenShop(shop._id)}
                                    className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                                >
                                    Visit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onUnfollow(shop._id)}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Unfollow
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <button type="button" onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50">
                        Prev
                    </button>
                    <span className="text-xs font-medium text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button type="button" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50">
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default FollowingTab;
