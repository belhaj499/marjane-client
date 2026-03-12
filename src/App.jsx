import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import { isAdminLoggedIn } from "./admin/auth/adminAuth";
import { useCart } from "./context/CartContext";
import "./App.css";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin"));
const AdminProducts = lazy(() => import("./admin/pages/AdminProducts"));
const AdminProductForm = lazy(() => import("./admin/pages/AdminProductForm"));
const AdminOrders = lazy(() => import("./admin/pages/AdminOrders"));
const AdminOrderDetails = lazy(() => import("./admin/pages/AdminOrderDetails"));
const AdminLayout = lazy(() => import("./admin/components/AdminLayout"));

const RequireAdmin = ({ children }) => {
  return isAdminLoggedIn() ? children : <Navigate to="/admin/login" replace />;
};

const App = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isAdminLogin = location.pathname === "/admin/login";
  const { toast } = useCart();
  const pageFallback = <p>Chargement...</p>;

  useEffect(() => {
    if (isAdmin) return;
    import("./utils/productsWarmup")
      .then(({ warmupFirstProductsPage }) =>
        Promise.allSettled([
          warmupFirstProductsPage({ gender: "HOMME", sort: "price,asc" }),
          warmupFirstProductsPage({ gender: "FEMME", sort: "price,asc" }),
          warmupFirstProductsPage({ gender: "UNISEX", sort: "price,asc" }),
        ])
      )
      .catch(() => {});
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <div className="app">
        {isAdminLogin && <Navbar />}
        <Toast toast={toast} />
        <Suspense fallback={pageFallback}>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Navigate to="/admin/products" replace />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/:id/edit" element={<AdminProductForm />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetails />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <Toast toast={toast} />
      <main className="container">
        <Suspense fallback={pageFallback}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/homme" element={<Products gender="HOMME" />} />
            <Route path="/femme" element={<Products gender="FEMME" />} />
            <Route path="/unisex" element={<Products gender="UNISEX" />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
