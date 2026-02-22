import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAdminCredentials } from "../auth/adminAuth";

const AdminLayout = () => {
  const navigate = useNavigate();

  const onLogout = () => {
    clearAdminCredentials();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <div className="admin">
      <header className="nav admin-nav">
        <div className="brand">Connexion</div>
        <nav className="nav-links">
          <NavLink className={linkClass} to="/admin/products">Produits</NavLink>
          <NavLink className={linkClass} to="/admin/orders">Commandes</NavLink>
        </nav>
        <button className="btn" onClick={onLogout}>Deconnexion</button>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
