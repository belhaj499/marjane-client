import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, total } = useCart();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (items.length > 0) return;

    const controller = new AbortController();

    getProducts({
      page: 0,
      size: 3,
      sort: "price,asc",
      signal: controller.signal,
    })
      .then((data) => {
        const visible = (data?.content || []).filter((product) => product?.active !== false);
        setSuggestions(visible.slice(0, 3));
      })
      .catch(() => {});

    return () => controller.abort();
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="page">
        <section className="empty-cart">
          <h1>Votre panier est vide</h1>
          <p>Decouvrez quelques parfums qui pourraient vous plaire.</p>
          <Link className="btn btn-primary" to="/homme">Acheter maintenant</Link>
        </section>

        {suggestions.length > 0 && (
          <section className="empty-cart-suggestions">
            <div className="section-head">
              <h2>Suggestions pour vous</h2>
              <p>Une petite selection pour relancer vos achats.</p>
            </div>
            <div className="grid">
              {suggestions.map((product) => (
                <ProductCard key={product.id} product={product} fromPath="/cart" />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Votre panier</h1>
      <div className="cart-list">
        {items.map((item) => (
          <div className="cart-item" key={item.product.id}>
            <div>
              <strong>{item.product.name}</strong>
              <div className="muted">{item.product.brand}</div>
            </div>
            <div className="cart-qty">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.product.id, e.target.value)}
              />
            </div>
            <div className="cart-price">
              {(item.product.price * item.quantity).toFixed(2)} DH
            </div>
            <button className="btn" onClick={() => removeFromCart(item.product.id)}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
      <div className="cart-total">
        <strong>Total: {total.toFixed(2)} DH</strong>
      </div>
      <Link className="btn btn-primary" to="/checkout">Passer a la caisse</Link>
    </div>
  );
};

export default Cart;
