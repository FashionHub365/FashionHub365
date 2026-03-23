import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import PrivateRoute from "./components/PrivateRoute";
import { Landing } from "./pages/Landing";
import { About } from "./pages/About";
import { Blog } from "./pages/Blog";
import { BlogPost } from "./pages/BlogPost";
import { ProductDetail } from "./pages/ProductDetail";
import { PaymentResult } from "./pages/PaymentResult";
import { Stores } from "./pages/Stores";
import { Listing } from "./pages/Listing";
import { StoreProfile } from "./pages/StoreProfile";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Profile } from "./pages/Profile";
import NotificationsPage from "./pages/NotificationsPage";
import VerifyEmail from "./pages/VerifyEmail";
import { Layout } from "./components/Layout";
import "./App.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { CheckoutShipping } from "./pages/CheckoutShipping";
import { CheckoutReview } from "./pages/CheckoutReview";
import RoleRoute from "./components/RoleRoute";
import Forbidden from "./pages/Forbidden";

// Lazy load Seller Components
const SellerDashboard = lazy(() => import("./pages/seller/sellerDashboard/SellerDashboard"));
const SellerOrders = lazy(() => import("./pages/seller/sellerOrders/SellerOrders"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const SellerInventory = lazy(() => import("./pages/seller/SellerInventory"));
const SellerWallet = lazy(() => import("./pages/seller/SellerWallet"));
const SellerVouchers = lazy(() => import("./pages/seller/SellerVouchers"));
const SellerChat = lazy(() => import("./pages/seller/sellerChat/SellerChat"));
const SellerProfile = lazy(() => import("./pages/seller/SellerProfile"));
const SellerStoreSettings = lazy(() => import("./pages/seller/SellerStoreSettings"));
const SellerLayout = lazy(() => import("./pages/seller/components/SellerLayout"));
const SellerRegistration = lazy(() => import("./pages/seller/SellerRegistration"));

// Lazy load Admin Routes
const AdminRoutes = lazy(() => import("./modules/admin/routes/AdminRoutes"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <Layout>
              <ToastContainer position="top-right" autoClose={3000} />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/how-to-style-winter-whites" element={<BlogPost />} />
                  <Route path="/product-detail" element={<ProductDetail />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/stores/:storeId" element={<StoreProfile />} />
                  <Route path="/men" element={<Listing />} />
                  <Route path="/listing" element={<Listing />} />
                  <Route path="/payment-result" element={<PaymentResult />} />
                  <Route path="/forbidden" element={<Forbidden />} />

                  {/* Protected Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/checkout" element={<CheckoutShipping />} />
                    <Route path="/checkout/review" element={<CheckoutReview />} />
                  </Route>

                  <Route element={<RoleRoute allowedRoles={['user']} />}>
                    <Route path="/seller/register" element={<SellerRegistration />} />
                  </Route>

                  {/* Seller Routes (Admin can also access) */}
                  <Route element={<RoleRoute allowedRoles={['seller', 'admin']} />}>
                    <Route path="/seller" element={<SellerLayout />}>
                      <Route path="dashboard" element={<SellerDashboard />} />
                      <Route path="orders" element={<SellerOrders />} />
                      <Route path="products" element={<SellerProducts />} />
                      <Route path="inventory" element={<SellerInventory />} />
                      <Route path="wallet" element={<SellerWallet />} />
                      <Route path="vouchers" element={<SellerVouchers />} />
                      <Route path="chat" element={<SellerChat />} />
                      <Route path="profile" element={<SellerProfile />} />
                      <Route path="settings" element={<SellerStoreSettings />} />
                    </Route>
                  </Route>

                  {/* Admin Routes */}
                  <Route element={<RoleRoute allowedRoles={['admin']} />}>
                    <Route path="/admin/*" element={<AdminRoutes />} />
                  </Route>

                  {/* 404 Not Found */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
