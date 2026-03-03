/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminOrder, getAdminOrders } from "../api/adminOrders";
import AdminPagination from "../components/AdminPagination";
import StatusBadge from "../components/StatusBadge";

const AdminOrders = () => {
  const size = 10;
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 1, number: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const sortOrdersNewestFirst = (orders) => {
    return [...(orders || [])].sort((a, b) => {
      const aTs = Date.parse(a?.createdAt || "") || 0;
      const bTs = Date.parse(b?.createdAt || "") || 0;
      if (bTs !== aTs) return bTs - aTs;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  };

  const load = () => {
    setLoading(true);
    setError("");
    getAdminOrders({ page, size, status: "", sort: "createdAt,desc" })
      .then((res) => {
        if (Array.isArray(res)) {
          setData({
            content: sortOrdersNewestFirst(res),
            totalPages: 1,
            number: 0,
          });
        } else {
          setData({
            ...res,
            content: sortOrdersNewestFirst(res?.content || []),
          });
        }
      })
      .catch(() => setError("Echec du chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const onDelete = async (id) => {
    if (!window.confirm("Supprimer cette commande ?")) return;
    setMessage("");
    setError("");
    try {
      await deleteAdminOrder(id);
      setMessage("Commande supprimee");
      load();
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Echec de suppression";
      setError(backendMessage);
    }
  };

  return (
    <div className="page">
      <h1>Commandes</h1>

      {loading && <p>Chargement...</p>}
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      <div className="card">
        <div className="card-body">
          <div className="admin-table-wrap">
            <table className="admin-orders-table" width="100%">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Telephone</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.content?.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customerName}</td>
                    <td>{o.phone}</td>
                    <td>{Number(o.total).toFixed(2)} DH</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>{o.createdAt}</td>
                    <td>
                      <Link className="btn" to={`/admin/orders/${o.id}`}>Voir</Link>{" "}
                      <button className="btn" onClick={() => onDelete(o.id)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminPagination
        page={data.number || page}
        totalPages={data.totalPages || 0}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AdminOrders;
