import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { count } = useCart();

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="nav">
      <Link className="brand" to="/">Kadiri Parfum</Link>
      <nav className="nav-links">
        <NavLink className={linkClass} to="/">Accueil</NavLink>
        <NavLink className={linkClass} to="/homme">Homme</NavLink>
        <NavLink className={linkClass} to="/femme">Femme</NavLink>
        <NavLink className={linkClass} to="/cart">Panier ({count})</NavLink>
      </nav>
      <NavLink className="nav-link nav-link-right" to="/admin/login">Connexion</NavLink>
      <div className="nav-spacer" />
    </header>
  );
};

export default Navbar;
