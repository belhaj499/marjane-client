import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="page">
        <h1>Votre panier est vide</h1>
        <Link className="btn btn-primary" to="/homme">Acheter maintenant</Link>
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
