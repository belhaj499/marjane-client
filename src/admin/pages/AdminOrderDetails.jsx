import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAdminOrderById, updateAdminOrderStatus } from "../api/adminOrders";
import StatusBadge from "../components/StatusBadge";
import { buildImageUrl } from "../../api/axios";

const statusOptions = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED"];

const AdminOrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    getAdminOrderById(id)
      .then((res) => setOrder(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const onStatusChange = async (next) => {
    if (!order || next === order.status) return;
    setMessage("");
    setUpdatingStatus(true);
    try {
      await updateAdminOrderStatus(id, next);
      load();
      setMessage("Statut mis a jour");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (!order) return null;

  return (
    <div className="page">
      <Link className="btn" to="/admin/orders">Retour</Link>
      <h1>Commande #{order.id}</h1>
      <p><StatusBadge status={order.status} /></p>
      <p>Client: {order.customerName}</p>
      <p>Telephone: {order.phone}</p>
      <p>Adresse: {order.address}</p>
      <p>Total: {Number(order.total).toFixed(2)} DH</p>

      <div className="field">
        <label>Mettre a jour le statut</label>
        <div className="status-actions">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              className={s === order.status ? "btn btn-primary" : "btn"}
              onClick={() => onStatusChange(s)}
              disabled={updatingStatus}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      <h2>Articles</h2>
      <div className="card">
        <div className="card-body">
          <div className="admin-table-wrap">
            <table className="admin-order-items-table" width="100%">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Produit</th>
                  <th>Prix</th>
                  <th>Qte</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.imageUrl ? (
                        <img src={buildImageUrl(i.imageUrl)} alt={i.productName} width="40" height="40" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{i.productName}</td>
                    <td>{Number(i.unitPrice).toFixed(2)} DH</td>
                    <td>{i.quantity}</td>
                    <td>{Number(i.lineTotal).toFixed(2)} DH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
