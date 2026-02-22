import { Link } from "react-router-dom";
import { buildImageUrl } from "../api/axios";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const image = buildImageUrl(product.imageUrl);

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
        <p className="card-sub">{product.brand} - {product.gender}</p>
        <div className="card-row">
          <span className="price">{product.price.toFixed(2)} DH</span>
        </div>
        <div className="card-actions">
          <Link className="btn" to={`/products/${product.id}`}>Voir</Link>
          <button
            className="btn btn-primary"
            onClick={() => addToCart(product, 1)}
            disabled={!product.available}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
