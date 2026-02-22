import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductById } from "../api/products";
import { buildImageUrl } from "../api/axios";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    getProductById(id)
      .then((res) => {
        if (mounted) setProduct(res);
      })
      .catch(() => {
        if (mounted) setError("Echec du chargement du produit");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!product) return null;

  const image = buildImageUrl(product.imageUrl);

  return (
    <div className="page">
      <Link className="btn" to="/">Retour</Link>
      <div className="details">
        <div className="details-image">
          {image ? (
            <img src={image} alt={product.name} />
          ) : (
            <div className="img-placeholder">Pas d'image</div>
          )}
        </div>
        <div className="details-body">
          <h1>{product.name}</h1>
          <p className="muted">{product.brand} - {product.gender}</p>
          <p>{product.description}</p>
          <p className="price">{product.price.toFixed(2)} DH</p>
          <p>
            {product.available ? (
              <span className="badge badge-available">Disponible</span>
            ) : (
              <span className="badge badge-unavailable">Rupture</span>
            )}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => addToCart(product, 1)}
            disabled={!product.available}
          >
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
