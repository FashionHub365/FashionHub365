import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { About } from "./pages/About";
import { Blog } from "./pages/Blog";
import { BlogPost } from "./pages/BlogPost";
import { ProductDetail } from "./pages/ProductDetail";
import { Stores } from "./pages/Stores";
import { Listing } from "./pages/Listing";
import "./App.css";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerProducts from "./pages/seller/SellerProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import SellerDashboard from "./pages/seller/SellerDashboard";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/how-to-style-winter-whites" element={<BlogPost />} />
          <Route path="/product-detail" element={<ProductDetail />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/men" element={<Listing />} />
          <Route path="/listing" element={<Listing />} />
          
          {/* Seller Routes */}
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />

          {/* Admin Routes */}
          <Route path="/admin/categories" element={<AdminCategories />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;