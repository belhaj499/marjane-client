/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getProductById } from "../api/products";
import { buildImageUrl } from "../api/axios";
import { useCart } from "../context/CartContext";
import {
  extractSeasonTags,
  extractWearTags,
  extractImageUrls,
  stripProductMeta,
} from "../utils/productSeasons";

const PRODUCT_CACHE_TTL_MS = 10 * 60 * 1000;

const readProductCache = (id) => {
  try {
    const raw = sessionStorage.getItem(`product-details|${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > PRODUCT_CACHE_TTL_MS) {
      sessionStorage.removeItem(`product-details|${id}`);
      return null;
    }
    return parsed.data || null;
  } catch {
    return null;
  }
};

const writeProductCache = (id, data) => {
  try {
    sessionStorage.setItem(
      `product-details|${id}`,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore storage failures.
  }
};

const ProductDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(() => {
    const routeProduct = location.state?.product;
    if (routeProduct && String(routeProduct.id) === String(id)) {
      return routeProduct;
    }
    return readProductCache(id);
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(() => !product);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const routeProduct = location.state?.product;
    const hasRouteProduct = routeProduct && String(routeProduct.id) === String(id);
    const cachedProduct = readProductCache(id);
    const immediate = hasRouteProduct ? routeProduct : cachedProduct;

    if (immediate) {
      setProduct(immediate);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError("");

    getProductById(id)
      .then((res) => {
        if (!mounted) return;
        setProduct(res);
        writeProductCache(id, res);
      })
      .catch(() => {
        if (!mounted) return;
        if (!immediate) setError("Echec du chargement du produit");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const imageList = (() => {
    const fromApi = Array.isArray(product?.imageUrls)
      ? product.imageUrls.map((url) => buildImageUrl(url)).filter(Boolean)
      : [];
    if (fromApi.length > 0) return fromApi;

    const fromMeta = extractImageUrls(product?.description).map((url) => buildImageUrl(url));
    if (fromMeta.length > 0) return fromMeta;
    return product?.imageUrl ? [buildImageUrl(product.imageUrl)] : [];
  })();
  const image = imageList[activeImageIndex] || "";
  const seasons = extractSeasonTags(product?.description);
  const wearTags = extractWearTags(product?.description);
  const fromQuery = (() => {
    try {
      const params = new URLSearchParams(location.search);
      const raw = params.get("from");
      if (!raw) return null;
      return raw.startsWith("/") ? raw : null;
    } catch {
      return null;
    }
  })();
  const backTarget = location.state?.from;
  const storedBackTarget = (() => {
    try {
      return sessionStorage.getItem("last-products-route");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (activeImageIndex < imageList.length) return;
    setActiveImageIndex(0);
  }, [activeImageIndex, imageList.length]);

  if (loading && !product) return <p>Chargement...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!product) return null;

  const showGalleryControls = imageList.length > 1;

  const goPrevImage = () => {
    if (!showGalleryControls) return;
    setActiveImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const goNextImage = () => {
    if (!showGalleryControls) return;
    setActiveImageIndex((prev) => (prev + 1) % imageList.length);
  };

  const handleBack = () => {
    if (typeof fromQuery === "string" && fromQuery.length > 0) {
      navigate(fromQuery);
      return;
    }
    if (typeof backTarget === "string" && backTarget.length > 0) {
      navigate(backTarget);
      return;
    }
    if (typeof storedBackTarget === "string" && storedBackTarget.length > 0) {
      navigate(storedBackTarget);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (product.gender === "HOMME") {
      navigate("/homme");
      return;
    }
    if (product.gender === "FEMME") {
      navigate("/femme");
      return;
    }
    navigate("/");
  };

  return (
    <div className="page">
      <button className="btn" type="button" onClick={handleBack}>
        Retour
      </button>
      <div className="details">
        <div className="details-image details-image-dynamic">
          {image ? (
            <div className="details-image-track">
              {showGalleryControls && (
                <button
                  type="button"
                  className="details-image-nav details-image-nav-prev"
                  onClick={goPrevImage}
                  aria-label="Image precedente"
                >
                  {"<"}
                </button>
              )}
              <img src={image} alt={product.name} className="details-main-image" />
              {showGalleryControls && (
                <button
                  type="button"
                  className="details-image-nav details-image-nav-next"
                  onClick={goNextImage}
                  aria-label="Image suivante"
                >
                  {">"}
                </button>
              )}
            </div>
          ) : (
            <div className="img-placeholder">Pas d'image</div>
          )}
        </div>
        <div className="details-body details-body-dynamic">
          <h1>{product.name}</h1>
          <p className="muted">
            {product.brand} - {product.gender}
          </p>
          {Number.isFinite(Number(product.volumeMl)) && Number(product.volumeMl) > 0 && (
            <p className="muted">
              <span className="volume-pill">Contenance: {Number(product.volumeMl)} ml</span>
            </p>
          )}

          {(seasons.length > 0 || wearTags.length > 0) && (
            <div className="details-meta">
              {seasons.length > 0 && (
                <div className="details-meta-group">
                  <span className="details-meta-label">Saison</span>
                  <div className="season-tags">
                    {seasons.map((s) => (
                      <span key={s} className="season-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {wearTags.length > 0 && (
                <div className="details-meta-group">
                  <span className="details-meta-label">Moment</span>
                  <div className="season-tags">
                    {wearTags.map((w) => (
                      <span key={w} className="season-tag season-tag-alt">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="details-description-card">
            <p className="details-description">{stripProductMeta(product.description)}</p>
          </div>
          <p className="price">{product.price.toFixed(2)} DH</p>
          <p>
            {product.available ? (
              <span className="badge badge-available">Disponible</span>
            ) : (
              <span className="badge badge-unavailable">Rupture</span>
            )}
          </p>
          <button className="btn btn-primary details-cta" onClick={() => addToCart(product, 1)} disabled={!product.available}>
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

