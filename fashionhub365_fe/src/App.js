import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import PrivateRoute from "./components/PrivateRoute";
import { Landing } from "./pages/Landing";
import { About } from "./pages/About";
import { Blog } from "./pages/Blog";
import { BlogPost } from "./pages/BlogPost";
import { ProductDetail } from "./pages/ProductDetail";
import { Stores } from "./pages/Stores";
import { Listing } from "./pages/Listing";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import { CheckoutShipping } from "./pages/CheckoutShipping";
import { CheckoutReview } from "./pages/CheckoutReview";
import { Layout } from "./components/Layout";
import "./App.css";
import SellerOrders from "./pages/seller/sellerOrders/SellerOrders";
import SellerProducts from "./pages/seller/SellerProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import SellerDashboard from "./pages/seller/sellerDashboard/SellerDashboard";
import SellerLayout from "./pages/seller/components/SellerLayout";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/how-to-style-winter-whites" element={<BlogPost />} />
              <Route path="/product-detail" element={<ProductDetail />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/men" element={<Listing />} />
              <Route path="/listing" element={<Listing />} />
              <Route path="/checkout" element={<CheckoutShipping />} />
              <Route path="/checkout/review" element={<CheckoutReview />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/profile" element={<Profile />} />

                {/* Seller Routes */}
                <Route path="/seller" element={<SellerLayout />}>
                  <Route path="dashboard" element={<SellerDashboard />} />
                  <Route path="orders" element={<SellerOrders />} />
                  <Route path="products" element={<SellerProducts />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin/categories" element={<AdminCategories />} />
              </Route>

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;