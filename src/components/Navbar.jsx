import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import siteLogo from "../assets/site-logo.png";

const NavIcon = ({ kind }) => {
  if (kind === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 11.5 12 4l9 7.5v8a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (kind === "man") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14 4h6v6h-2V7.41l-3.16 3.17a7 7 0 1 1-1.42-1.42L16.59 6H14zM10 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (kind === "woman") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3a5 5 0 0 1 1 9.9V16h3v2h-3v3h-2v-3H8v-2h3v-3.1A5 5 0 0 1 12 3zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (kind === "unisex") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M17 3h4v4h-2V6.41l-2.63 2.63A4.97 4.97 0 0 1 17 12a5 5 0 0 1-4 4.9V19h3v2h-3v2h-2v-2H8v-2h3v-2.1A5 5 0 1 1 14.96 8.37L17.59 5H17V3zM8 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (kind === "cart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 4h2l2.1 10.2A2 2 0 0 0 9.06 16H18a2 2 0 0 0 1.93-1.48L22 7H7.1L6.7 5H3zm6 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2a5 5 0 0 1 5 5v2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v2h6V7a3 3 0 0 0-3-3z"
        fill="currentColor"
      />
    </svg>
  );
};

const NavItem = ({ to, className, icon, children }) => (
  <NavLink className={className} to={to}>
    <span className="nav-link-icon">
      <NavIcon kind={icon} />
    </span>
    <span>{children}</span>
  </NavLink>
);

const Navbar = () => {
  const { count } = useCart();

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="nav">
      <Link className="brand" to="/">
        <span className="brand-logo-frame">
          <img className="brand-logo" src={siteLogo} alt="Kadiri Parfum" />
        </span>
        <span className="brand-text">Kadiri Parfum</span>
      </Link>
      <nav className="nav-links">
        <NavItem className={linkClass} to="/" icon="home">Accueil</NavItem>
        <NavItem className={linkClass} to="/homme" icon="man">Homme</NavItem>
        <NavItem className={linkClass} to="/femme" icon="woman">Femme</NavItem>
        <NavItem className={linkClass} to="/unisex" icon="unisex">Unisex</NavItem>
        <NavItem className={linkClass} to="/cart" icon="cart">Panier ({count})</NavItem>
      </nav>
      <NavItem className="nav-link nav-link-right" to="/admin/login" icon="login">Connexion</NavItem>
      <div className="nav-spacer" />
    </header>
  );
};

export default Navbar;
