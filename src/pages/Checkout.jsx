import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../api/orders";
import { useCart } from "../context/CartContext";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clearCart, showToast } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      setMessage("Votre panier est vide");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const orderItems = items.map((i) => ({
        productId: i.product?.id ?? i.id,
        quantity: i.quantity,
      }));

      const invalidItem = orderItems.find(
        (i) => i.productId === undefined || i.productId === null || Number(i.quantity) <= 0
      );
      if (invalidItem) {
        setMessage("Panier invalide: produit ou quantite non valide.");
        setLoading(false);
        return;
      }

      const payload = {
        customerName,
        name: customerName,
        phone,
        customerPhone: phone,
        address,
        customerAddress: address,
        items: orderItems,
        orderItems,
      };

      await createOrder(payload);

      clearCart();
      setCustomerName("");
      setPhone("");
      setAddress("");
      setMessage("Commande envoyee avec succes. Merci!");
      showToast("Commande envoyee avec succes");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      const responseData = err?.response?.data;
      const rawResponseText =
        responseData && typeof responseData === "object"
          ? JSON.stringify(responseData)
          : String(responseData || "");
      const validationErrors = Array.isArray(responseData?.errors)
        ? responseData.errors.join(", ")
        : Array.isArray(responseData?.fieldErrors)
        ? responseData.fieldErrors.map((e) => e?.defaultMessage || e?.message).filter(Boolean).join(", ")
        : null;
      const backendMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message ||
            responseData?.error ||
            validationErrors ||
            responseData?.details ||
            rawResponseText ||
            null;

      console.error("ORDER ERROR:", {
        status: err?.response?.status,
        data: responseData,
        raw: rawResponseText,
        url: err?.config?.url,
        method: err?.config?.method,
      });
      setMessage(
        backendMessage ||
          `Echec de la commande (status ${err?.response?.status || "??"})`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page checkout-page">
      <h1>Commande</h1>
      <p>Total: {total.toFixed(2)} DH</p>
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label>Nom</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Telephone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="field">
          <label>Adresse</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Confirmer"}
        </button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default Checkout;
