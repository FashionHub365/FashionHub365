import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import { Landing } from "./pages/Landing";
import { About } from "./pages/About";
import { Blog } from "./pages/Blog";
import { BlogPost } from "./pages/BlogPost";
import { ProductDetail } from "./pages/ProductDetail";
import { Stores } from "./pages/Stores";
import { Listing } from "./pages/Listing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail"; // Correct default import
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
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
            <Route path="/stores" element={<Stores />} />
            <Route path="/men" element={<Listing />} />
            <Route path="/listing" element={<Listing />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
