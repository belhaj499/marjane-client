import { Link, useLocation } from "react-router-dom";
import { buildImageUrl } from "../api/axios";
import { useCart } from "../context/CartContext";

const resolvePrimaryImage = (product) => {
  const ordered = [
    product?.imageUrl,
    ...(Array.isArray(product?.imageUrls) ? product.imageUrls : []),
  ].filter(Boolean);
  return ordered[0] || "";
};

const ProductCard = ({ product, fromPath }) => {
  const { addToCart } = useCart();
  const location = useLocation();
  const from =
    typeof fromPath === "string" && fromPath.startsWith("/")
      ? fromPath
      : `${location.pathname}${location.search}`;
  const handleSee = () => {
    try {
      sessionStorage.setItem("last-products-route", from);
    } catch {
      // Ignore storage failures.
    }
  };
  const primaryImage = resolvePrimaryImage(product);
  const image = buildImageUrl(primaryImage);

  return (
    <div className="card">
      <div className="card-image">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" />
        ) : (
          <div className="img-placeholder">Pas d'image</div>
        )}
        {product.available ? (
          <span className="badge badge-available">Disponible</span>
        ) : (
          <span className="badge badge-unavailable">Rupture</span>
        )}
      </div>
      <div className="card-body">
        <h3 className="card-title">{product.name}</h3>
        <p className="card-sub">
          {product.brand} - {product.gender}
        </p>
        <div className="card-row">
          <span className="price">{product.price.toFixed(2)} DH</span>
        </div>
        <div className="card-actions">
          {/*
            Keep the list route in query string too so refresh on details page
            still knows where to go back.
          */}
          <Link
            className="btn"
            to={{
              pathname: `/products/${product.id}`,
              search: `?from=${encodeURIComponent(from)}`,
            }}
            onClick={handleSee}
            state={{
              from,
              product,
            }}
          >
            Voir
          </Link>
          <button className="btn btn-primary" onClick={() => addToCart(product, 1)} disabled={!product.available}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
