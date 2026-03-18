import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import addressApi from "../apis/addressApi";
import checkoutApi from "../apis/checkoutApi";
import storeApi from "../apis/store.api";
import wishlistApi from "../apis/wishlistApi";
import { confirmAction, showSuccess, showError } from "../utils/swalUtils";
import { useAuth } from "../contexts/AuthContext";

// Modular Components
import ProfileSidebar from "./Profile/ProfileSidebar";
import OverviewTab from "./Profile/OverviewTab";
import OrdersTab from "./Profile/OrdersTab";
import AddressesTab from "./Profile/AddressesTab";
import WishlistTab from "./Profile/WishlistTab";
import FollowingTab from "./Profile/FollowingTab";
import AffiliateTab from "./Profile/AffiliateTab";

// Utilities
import { toCheckoutShipping } from "./Profile/utils";

export const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState(location.state?.tab || "orders");
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");

    const [wishlist, setWishlist] = useState([]);
    const [loadingWishlist, setLoadingWishlist] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [addressesError, setAddressesError] = useState("");
    const [addressesSubmitting, setAddressesSubmitting] = useState(false);

    const [following, setFollowing] = useState([]);
    const [loadingFollowing, setLoadingFollowing] = useState(false);
    const [followingPage, setFollowingPage] = useState(1);
    const [totalFollowingPages, setTotalFollowingPages] = useState(1);
    const followingLimit = 6;

    useEffect(() => {
        if (location.state?.tab) setActiveTab(location.state.tab);
    }, [location.state]);

    const fetchOrders = async () => {
        setOrdersLoading(true);
        setOrdersError("");
        try {
            const res = await checkoutApi.getMyOrders();
            if (res.success) setOrders(res.data || []);
        } catch {
            setOrdersError("Cannot load orders.");
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchWishlist = async (page) => {
        setLoadingWishlist(true);
        try {
            const res = await wishlistApi.getWishlist(page, 6);
            if (res.success) {
                setWishlist(res.data.items || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            }
        } finally {
            setLoadingWishlist(false);
        }
    };

    const fetchFollowing = async (page) => {
        setLoadingFollowing(true);
        try {
            const res = await storeApi.getFollowingStores(page, followingLimit);
            if (res.success) {
                setFollowing(res.data.stores || []);
                setTotalFollowingPages(res.data.pagination?.totalPages || 1);
            }
        } finally {
            setLoadingFollowing(false);
        }
    };

    const fetchAddresses = async () => {
        setAddressesLoading(true);
        setAddressesError("");
        try {
            const res = await addressApi.getAddresses();
            if (res.success) {
                const list = res.data?.addresses || res.data || [];
                setAddresses(Array.isArray(list) ? list : []);
            }
        } catch (e) {
            setAddressesError(e.response?.data?.message || "Cannot load addresses.");
        } finally {
            setAddressesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "orders" || activeTab === "profile") fetchOrders();
        if (activeTab === "wishlist" && user) fetchWishlist(currentPage);
        if (activeTab === "following" && user) fetchFollowing(followingPage);
        if ((activeTab === "addresses" || activeTab === "profile") && user) fetchAddresses();
    }, [activeTab, user, currentPage, followingPage]);

    const saveAddress = async (payload, uuid) => {
        setAddressesSubmitting(true);
        setAddressesError("");
        try {
            if (uuid) await addressApi.updateAddress(uuid, payload);
            else await addressApi.createAddress(payload);
            await fetchAddresses();
            return true;
        } catch (e) {
            setAddressesError(e.response?.data?.message || "Cannot save address.");
            return false;
        } finally {
            setAddressesSubmitting(false);
        }
    };

    const deleteAddress = async (uuid) => {
        const isConfirmed = await confirmAction({
            title: "Xóa địa chỉ",
            text: "Bạn có chắc chắn muốn xóa địa chỉ này không?",
            icon: "warning"
        });
        if (!isConfirmed) return;
        try {
            await addressApi.deleteAddress(uuid);
            await fetchAddresses();
        } catch (e) {
            setAddressesError(e.response?.data?.message || "Cannot delete address.");
        }
    };

    const setDefaultAddress = async (uuid) => {
        try {
            await addressApi.setDefaultAddress(uuid);
            await fetchAddresses();
        } catch (e) {
            setAddressesError(e.response?.data?.message || "Cannot set default address.");
        }
    };

    const useForCheckout = (address) => {
        sessionStorage.setItem("checkout_shipping", JSON.stringify(toCheckoutShipping(address, user?.email || "")));
        navigate("/checkout");
    };

    const handleCancelOrder = async (orderId) => {
        const isConfirmed = await confirmAction({
            title: "Hủy đơn hàng",
            text: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
            icon: "warning"
        });
        if (!isConfirmed) return;
        try {
            const res = await checkoutApi.cancelOrder(orderId);
            if (res.data?.success || res.success) {
                showSuccess("Đã hủy đơn hàng thành công.");
                fetchOrders();
            }
        } catch (e) {
            showError(e.response?.data?.message || "Không thể hủy đơn hàng.");
        }
    };

    const removeWishlist = async (productId) => {
        await wishlistApi.removeFromWishlist(productId);
        fetchWishlist(currentPage);
    };

    const unfollowStore = async (storeId) => {
        const isConfirmed = await confirmAction({
            title: "Bỏ theo dõi",
            text: "Bạn có chắc chắn muốn bỏ theo dõi cửa hàng này không?",
            icon: "question"
        });
        if (!isConfirmed) return;
        try {
            const res = await storeApi.unfollowStore(storeId);
            if (res.success) fetchFollowing(followingPage);
        } catch (e) {
            console.error("Failed to unfollow shop", e);
        }
    };

    const summary = useMemo(
        () => ({
            totalOrders: orders.length,
            pendingOrders: orders.filter((o) => ["pending_payment", "created"].includes(o.status)).length,
            completedOrders: orders.filter((o) => o.status === "delivered").length,
            cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
            totalSpent: orders
                .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
                .reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
            totalAddresses: addresses.length,
            wishlistItems: wishlist.length,
        }),
        [orders, addresses, wishlist]
    );

    const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
    const defaultAddress = useMemo(() => addresses.find((a) => a.is_default) || addresses[0] || null, [addresses]);

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex h-screen items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: "Overview" },
        { id: "orders", label: "Orders" },
        { id: "addresses", label: "Addresses" },
        { id: "wishlist", label: "Wishlist" },
        { id: "following", label: "Following" },
        { id: "affiliate", label: "Affiliate" },
        { id: "settings", label: "Settings" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="absolute top-0 z-0 h-56 w-full overflow-hidden bg-gray-200">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.25),transparent_35%)]" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-lg">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile?.full_name || user.username || "User")}&background=111827&color=fff&size=256`}
                                alt={user.username || "User"}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="text-gray-900">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Account</p>
                            <h1 className="mt-1 text-2xl font-bold text-gray-900">{user.profile?.full_name || user.username}</h1>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            logout();
                            navigate("/login");
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-900"
                    >
                        Sign out
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                    <ProfileSidebar
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        summary={summary}
                    />

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-900">{tabs.find((t) => t.id === activeTab)?.label}</h2>
                            <p className="text-xs text-gray-600">Updated: {new Date().toLocaleDateString("vi-VN")}</p>
                        </div>

                        {activeTab === "profile" && (
                            <OverviewTab
                                user={user}
                                summary={summary}
                                recentOrders={recentOrders}
                                defaultAddress={defaultAddress}
                                onSetTab={setActiveTab}
                            />
                        )}

                        {activeTab === "orders" && (
                            <OrdersTab
                                orders={orders}
                                loading={ordersLoading}
                                error={ordersError}
                                onShop={() => navigate("/listing")}
                                onCancelOrder={handleCancelOrder}
                            />
                        )}

                        {activeTab === "addresses" && (
                            <AddressesTab
                                addresses={addresses}
                                loading={addressesLoading}
                                error={addressesError}
                                submitting={addressesSubmitting}
                                onSave={saveAddress}
                                onDelete={deleteAddress}
                                onSetDefault={setDefaultAddress}
                                onUseForCheckout={useForCheckout}
                            />
                        )}

                        {activeTab === "wishlist" && (
                            <WishlistTab
                                wishlist={wishlist}
                                loading={loadingWishlist}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                onRemove={removeWishlist}
                                onOpenProduct={(id) => navigate(`/product/${id}`)}
                            />
                        )}

                        {activeTab === "following" && (
                            <FollowingTab
                                stores={following}
                                loading={loadingFollowing}
                                currentPage={followingPage}
                                totalPages={totalFollowingPages}
                                onPageChange={setFollowingPage}
                                onUnfollow={unfollowStore}
                                onOpenShop={(id) => navigate(`/stores/${id}`)}
                            />
                        )}

                        {activeTab === "affiliate" && <AffiliateTab user={user} />}

                        {activeTab === "settings" && (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">Security settings UI will be added next.</div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
