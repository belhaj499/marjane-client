import { Link, useLocation } from "react-router-dom";
import { buildImageUrl } from "../api/axios";
import { useCart } from "../context/CartContext";
import { extractSeasonTags, extractWearTags } from "../utils/productSeasons";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const location = useLocation();
  const primaryImage = Array.isArray(product?.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls[0]
    : product?.imageUrl;
  const image = buildImageUrl(primaryImage);
  const seasons = extractSeasonTags(product.description).slice(0, 2);
  const wearTags = extractWearTags(product.description).slice(0, 2);

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
        {seasons.length > 0 && (
          <div className="season-tags">
            {seasons.map((s) => (
              <span key={s} className="season-tag">
                {s}
              </span>
            ))}
          </div>
        )}
        {wearTags.length > 0 && (
          <div className="season-tags">
            {wearTags.map((w) => (
              <span key={w} className="season-tag season-tag-alt">
                {w}
              </span>
            ))}
          </div>
        )}
        <div className="card-row">
          <span className="price">{product.price.toFixed(2)} DH</span>
        </div>
        <div className="card-actions">
          <Link className="btn" to={`/products/${product.id}`} state={{ from: `${location.pathname}${location.search}` }}>
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
