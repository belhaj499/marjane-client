import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminProducts,
  deleteAdminProduct,
} from "../api/adminProducts";
import AdminPagination from "../components/AdminPagination";
import AdminFilters from "../components/AdminFilters";
import { buildImageUrl } from "../../api/axios";

const AdminProducts = () => {
  const [gender, setGender] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("price,asc");
  const [size] = useState(10);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filterByBrand = (items) => {
    const q = brand.trim().toLowerCase();
    if (!q) return items;
    return (items || []).filter((p) => String(p.brand || "").toLowerCase().includes(q));
  };

  const load = () => {
    setLoading(true);
    setError("");
    const requestPage = brand.trim() ? 0 : page;
    const requestSize = brand.trim() ? 200 : size;
    getAdminProducts({ page: requestPage, size: requestSize, gender, brand, sort })
      .then((res) => {
        const content = filterByBrand(res?.content || []);
        if (brand.trim()) {
          setData({ content, totalPages: 1, number: 0 });
          return;
        }
        setData({ ...res, content });
      })
      .catch(() => setError("Echec du chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, size, gender, brand, sort]);

  useEffect(() => {
    setPage(0);
  }, [gender, brand, sort]);

  const onDelete = async (id) => {
    if (!confirm("Supprimer ce produit ?")) return;
    setMessage("");
    try {
      await deleteAdminProduct(id);
      setMessage("Produit supprime");
      load();
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Suppression refusee par le serveur (produit lie a des commandes).";
      setError(backendMessage);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card-body">
          <h1>Produits</h1>
          <Link className="btn btn-primary" to="/admin/products/new">Nouveau produit</Link>
        </div>
      </div>

      <AdminFilters
        gender={gender}
        setGender={setGender}
        brand={brand}
        setBrand={setBrand}
        sort={sort}
        setSort={setSort}
      />

      {loading && <p>Chargement...</p>}
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      <div className="card">
        <div className="card-body">
          <div className="admin-table-wrap">
            <table className="admin-products-table" width="100%">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Nom</th>
                  <th>Marque</th>
                  <th>Genre</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Actif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.content?.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>
                      {p.imageUrl ? (
                        <img src={buildImageUrl(p.imageUrl)} alt={p.name} width="40" height="40" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{p.name}</td>
                    <td>{p.brand}</td>
                    <td>{p.gender}</td>
                    <td>{Number(p.price).toFixed(2)} DH</td>
                    <td>{p.stock}</td>
                    <td>{p.active ? "Oui" : "Non"}</td>
                    <td>
                      <Link className="btn" to={`/admin/products/${p.id}/edit`}>Editer</Link>{" "}
                      <button className="btn" onClick={() => onDelete(p.id)}>Supprimer</button>
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

export default AdminProducts;
