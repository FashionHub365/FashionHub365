import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
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
import VerifyEmail from "./pages/VerifyEmail"; // Correct default import
import { Layout } from "./components/Layout";
import "./App.css";
import SellerOrders from "./pages/seller/sellerOrders/SellerOrders";
import SellerProducts from "./pages/seller/SellerProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import SellerDashboard from "./pages/seller/sellerDashboard/SellerDashboard";
import SellerLayout from "./pages/seller/components/SellerLayout";

import { CheckoutShipping } from "./pages/CheckoutShipping";
import { CheckoutReview } from "./pages/CheckoutReview";
import RoleRoute from "./components/RoleRoute";
import Forbidden from "./pages/Forbidden";

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <Layout>
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
                  <Route path="/checkout" element={<CheckoutShipping />} />
                  <Route path="/checkout/review" element={<CheckoutReview />} />
                </Route>

                {/* Seller Routes (Admin can also access) */}
                <Route element={<RoleRoute allowedRoles={['seller', 'admin']} />}>
                  <Route path="/seller" element={<SellerLayout />}>
                    <Route path="dashboard" element={<SellerDashboard />} />
                    <Route path="orders" element={<SellerOrders />} />
                    <Route path="products" element={<SellerProducts />} />
                  </Route>
                </Route>

                {/* Admin Routes */}
                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/categories" element={<AdminCategories />} />
                </Route>

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
