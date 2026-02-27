import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAdminCredentials } from "../auth/adminAuth";

const AdminIcon = ({ kind }) => {
  if (kind === "products") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4zm0 5h7v11H6a2 2 0 0 1-2-2zm9 0h7v9a2 2 0 0 1-2 2h-5z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (kind === "orders") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 3h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2zm2 5v2h8V8zm0 4v2h8v-2z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (kind === "logout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6v-2H5V5h6zm4.59 4L14.17 8.41 16.76 11H8v2h8.76l-2.59 2.59L15.59 17 21 11.59z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2 2 7v2h20V7zm-7 9h2v8H5zm6 0h2v8h-2zm6 0h2v8h-2zM2 21h20v-2H2z"
        fill="currentColor"
      />
    </svg>
  );
};

const AdminNavItem = ({ to, className, icon, children }) => (
  <NavLink className={className} to={to}>
    <span className="nav-link-icon">
      <AdminIcon kind={icon} />
    </span>
    <span>{children}</span>
  </NavLink>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!location.state?.showAdminWelcome) return;
    setShowWelcome(true);
    const timer = window.setTimeout(() => {
      setShowWelcome(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [location.state]);

  const onLogout = () => {
    clearAdminCredentials();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <div className="admin">
      {showWelcome && (
        <div className="admin-welcome-overlay" role="status" aria-live="polite">
          <div className="admin-welcome-card">
            <p className="admin-welcome-eyebrow">Bienvenue</p>
            <h2> Monsieur KADIRI</h2>
          </div>
        </div>
      )}
      <header className="nav admin-nav">
        <div className="brand">
          <span className="nav-link-icon">
            <AdminIcon kind="panel" />
          </span>
          <span>Admin</span>
        </div>
        <nav className="nav-links">
          <AdminNavItem className={linkClass} to="/admin/products" icon="products">
            Produits
          </AdminNavItem>
          <AdminNavItem className={linkClass} to="/admin/orders" icon="orders">
            Commandes
          </AdminNavItem>
        </nav>
        <button className="btn" onClick={onLogout}>
          <span className="nav-link-icon">
            <AdminIcon kind="logout" />
          </span>
          <span>Deconnexion</span>
        </button>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
