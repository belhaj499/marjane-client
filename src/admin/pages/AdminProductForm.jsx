import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  createAdminProduct,
  getAdminProductById,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../api/adminProducts";
import { buildImageUrl } from "../../api/axios";

const emptyForm = {
  name: "",
  brand: "",
  gender: "HOMME",
  price: 0,
  stock: 0,
  volumeMl: 0,
  description: "",
  active: true,
};

const AdminProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminProductById(id)
      .then((res) => {
        setForm(res);
        setInitialForm(res);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buildPayload = () => ({
    ...form,
    price: Number(form.price),
    stock: Number(form.stock),
    volumeMl: Number(form.volumeMl),
  });

  const buildChangedPayload = (basePayload, previousPayload) => {
    const keys = [
      "name",
      "brand",
      "gender",
      "price",
      "stock",
      "volumeMl",
      "description",
      "active",
      "imageUrl",
    ];
    const changed = {};
    keys.forEach((key) => {
      if (basePayload[key] !== previousPayload[key]) {
        changed[key] = basePayload[key];
      }
    });
    return changed;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        const previous = {
          ...initialForm,
          price: Number(initialForm.price),
          stock: Number(initialForm.stock),
          volumeMl: Number(initialForm.volumeMl),
        };
        const changedPayload = buildChangedPayload(payload, previous);
        if (Object.keys(changedPayload).length === 0) {
          setMessage("Aucune modification detectee");
          setLoading(false);
          return;
        }
        const updated = await updateAdminProduct(id, changedPayload);
        if (updated) {
          setForm(updated);
          setInitialForm(updated);
        } else {
          const refreshed = await getAdminProductById(id);
          setForm(refreshed);
          setInitialForm(refreshed);
        }
        setMessage("Produit mis a jour");
        navigate("/admin/products", { replace: true });
      } else {
        await createAdminProduct(payload);
        navigate("/admin/products", { replace: true });
      }
    } catch {
      setMessage("Echec de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage("");
    setLoading(true);
    try {
      let productId = id;

      if (!productId) {
        if (!form.name || !form.brand) {
          setMessage("Remplir au moins Nom et Marque avant l'upload.");
          setLoading(false);
          return;
        }
        const created = await createAdminProduct(buildPayload());
        productId = created.id;
        setForm(created);
      }

      const res = await uploadAdminProductImage(productId, file);
      if (res?.imageUrl) {
        setForm((prev) => ({ ...prev, imageUrl: res.imageUrl }));
      } else {
        const refreshed = await getAdminProductById(productId);
        setForm(refreshed);
      }
      setMessage("Image telechargee");
      if (!isEdit) navigate("/admin/products", { replace: true });
    } catch {
      setMessage("Echec upload image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>{isEdit ? "Modifier produit" : "Nouveau produit"}</h1>
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label>Nom</label>
          <input name="name" value={form.name || ""} onChange={onChange} required />
        </div>
        <div className="field">
          <label>Marque</label>
          <input name="brand" value={form.brand || ""} onChange={onChange} required />
        </div>
        <div className="field">
          <label>Genre</label>
          <select name="gender" value={form.gender || "HOMME"} onChange={onChange}>
            <option value="HOMME">Homme</option>
            <option value="FEMME">Femme</option>
          </select>
        </div>
        <div className="field">
          <label>Prix</label>
          <input name="price" type="number" value={form.price} onChange={onChange} step="0.01" />
        </div>
        <div className="field">
          <label>Stock</label>
          <input name="stock" type="number" value={form.stock} onChange={onChange} />
        </div>
        <div className="field">
          <label>Volume (ml)</label>
          <input name="volumeMl" type="number" value={form.volumeMl} onChange={onChange} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea name="description" value={form.description || ""} onChange={onChange} />
        </div>
        <div className="field">
          <label>
            <input
              name="active"
              type="checkbox"
              checked={Boolean(form.active)}
              onChange={onChange}
            />
            Actif
          </label>
        </div>

        <div className="field">
          <label>Ajouter une photo</label>
          {form.imageUrl && (
            <img
              src={buildImageUrl(form.imageUrl)}
              alt="Produit"
              width="120"
              style={{ display: "block", marginBottom: 8 }}
            />
          )}
          <input type="file" accept="image/*" onChange={onUpload} />
          <small className="muted">Choisir un fichier image (jpg, png...)</small>
        </div>

        <div className="card-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "En cours..." : "Enregistrer"}
          </button>
          <Link className="btn" to="/admin/products">Retour</Link>
        </div>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default AdminProductForm;
