import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  createAdminProduct,
  getAdminProductById,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../api/adminProducts";
import { buildImageUrl } from "../../api/axios";
import {
  SEASON_OPTIONS,
  WEAR_OPTIONS,
  attachProductMeta,
  extractSeasonTags,
  extractWearTags,
  extractImageUrls,
  stripProductMeta,
} from "../../utils/productSeasons";

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
  const [seasonTags, setSeasonTags] = useState([]);
  const [initialSeasonTags, setInitialSeasonTags] = useState([]);
  const [wearTags, setWearTags] = useState([]);
  const [initialWearTags, setInitialWearTags] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [initialImageUrls, setInitialImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminProductById(id)
      .then((res) => {
        const tags = extractSeasonTags(res?.description);
        const wear = extractWearTags(res?.description);
        const images = extractImageUrls(res?.description);
        const cleanedDescription = stripProductMeta(res?.description);
        const next = { ...res, description: cleanedDescription };
        setForm(next);
        setInitialForm(next);
        setSeasonTags(tags);
        setInitialSeasonTags(tags);
        setWearTags(wear);
        setInitialWearTags(wear);
        setImageUrls(images.length > 0 ? images : res?.imageUrl ? [res.imageUrl] : []);
        setInitialImageUrls(images.length > 0 ? images : res?.imageUrl ? [res.imageUrl] : []);
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

  const toggleSeason = (season) => {
    setSeasonTags((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  };

  const toggleWear = (wear) => {
    setWearTags((prev) => (prev.includes(wear) ? prev.filter((w) => w !== wear) : [...prev, wear]));
  };

  const buildPayload = () => ({
    ...form,
    description: attachProductMeta(form.description, seasonTags, wearTags, imageUrls),
    imageUrl: imageUrls[0] || form.imageUrl || "",
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
          description: attachProductMeta(
            initialForm.description,
            initialSeasonTags,
            initialWearTags,
            initialImageUrls
          ),
          imageUrl: initialImageUrls[0] || initialForm.imageUrl || "",
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
          const tags = extractSeasonTags(updated?.description);
          const wear = extractWearTags(updated?.description);
          const images = extractImageUrls(updated?.description);
          const cleanedDescription = stripProductMeta(updated?.description);
          const next = { ...updated, description: cleanedDescription };
          setForm(next);
          setInitialForm(next);
          setSeasonTags(tags);
          setInitialSeasonTags(tags);
          setWearTags(wear);
          setInitialWearTags(wear);
          setImageUrls(images.length > 0 ? images : updated?.imageUrl ? [updated.imageUrl] : []);
          setInitialImageUrls(images.length > 0 ? images : updated?.imageUrl ? [updated.imageUrl] : []);
        } else {
          const refreshed = await getAdminProductById(id);
          const tags = extractSeasonTags(refreshed?.description);
          const wear = extractWearTags(refreshed?.description);
          const images = extractImageUrls(refreshed?.description);
          const cleanedDescription = stripProductMeta(refreshed?.description);
          const next = { ...refreshed, description: cleanedDescription };
          setForm(next);
          setInitialForm(next);
          setSeasonTags(tags);
          setInitialSeasonTags(tags);
          setWearTags(wear);
          setInitialWearTags(wear);
          setImageUrls(images.length > 0 ? images : refreshed?.imageUrl ? [refreshed.imageUrl] : []);
          setInitialImageUrls(images.length > 0 ? images : refreshed?.imageUrl ? [refreshed.imageUrl] : []);
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setMessage("");
    setLoading(true);
    try {
      let productId = id;
      const primaryBeforeUpload = imageUrls[0] || form.imageUrl || "";

      if (!productId) {
        if (!form.name || !form.brand) {
          setMessage("Remplir au moins Nom et Marque avant l'upload.");
          setLoading(false);
          return;
        }
        const created = await createAdminProduct(buildPayload());
        productId = created.id;
        const tags = extractSeasonTags(created?.description);
        const wear = extractWearTags(created?.description);
        const images = extractImageUrls(created?.description);
        const cleanedDescription = stripProductMeta(created?.description);
        setForm({ ...created, description: cleanedDescription });
        setSeasonTags(tags);
        setInitialSeasonTags(tags);
        setWearTags(wear);
        setInitialWearTags(wear);
        setImageUrls(images.length > 0 ? images : created?.imageUrl ? [created.imageUrl] : []);
        setInitialImageUrls(images.length > 0 ? images : created?.imageUrl ? [created.imageUrl] : []);
        if (!isEdit) navigate(`/admin/products/${created.id}/edit`, { replace: true });
      }

      const uploadedUrls = [];
      for (const file of files) {
        const res = await uploadAdminProductImage(productId, file);
        if (res?.imageUrl) uploadedUrls.push(res.imageUrl);
      }

      if (uploadedUrls.length > 0) {
        const merged = [...new Set([...imageUrls, ...uploadedUrls])];
        const stablePrimary = primaryBeforeUpload || merged[0] || "";
        setImageUrls(merged);
        setForm((curr) => ({ ...curr, imageUrl: stablePrimary }));

        // The upload endpoint may overwrite product.imageUrl with the last uploaded file.
        // Force keeping the original primary image so cards/list stay stable.
        if (stablePrimary) {
          await updateAdminProduct(productId, { imageUrl: stablePrimary });
        }
      } else {
        const refreshed = await getAdminProductById(productId);
        const tags = extractSeasonTags(refreshed?.description);
        const wear = extractWearTags(refreshed?.description);
        const images = extractImageUrls(refreshed?.description);
        const cleanedDescription = stripProductMeta(refreshed?.description);
        setForm({ ...refreshed, description: cleanedDescription });
        setSeasonTags(tags);
        setInitialSeasonTags(tags);
        setWearTags(wear);
        setInitialWearTags(wear);
        setImageUrls(images.length > 0 ? images : refreshed?.imageUrl ? [refreshed.imageUrl] : []);
      }
      setMessage(uploadedUrls.length > 1 ? "Images telechargees" : "Image telechargee");
    } catch {
      setMessage("Echec upload image");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const removeImage = (imageToRemove) => {
    setImageUrls((prev) => {
      const next = prev.filter((url) => url !== imageToRemove);
      setForm((curr) => ({ ...curr, imageUrl: next[0] || "" }));
      return next;
    });
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
          <select name="volumeMl" value={form.volumeMl} onChange={onChange}>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea name="description" value={form.description || ""} onChange={onChange} />
        </div>

        <div className="field">
          <label>Saisons recommandees</label>
          <div className="season-checks">
            {SEASON_OPTIONS.map((s) => (
              <label key={s} className="season-check">
                <input
                  type="checkbox"
                  checked={seasonTags.includes(s)}
                  onChange={() => toggleSeason(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Quand le porter</label>
          <div className="season-checks">
            {WEAR_OPTIONS.map((w) => (
              <label key={w} className="season-check">
                <input
                  type="checkbox"
                  checked={wearTags.includes(w)}
                  onChange={() => toggleWear(w)}
                />
                {w}
              </label>
            ))}
          </div>
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
          <label>Ajouter des photos</label>
          {imageUrls.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {imageUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} style={{ position: "relative" }}>
                  <img src={buildImageUrl(url)} alt={`Produit ${idx + 1}`} width="90" height="90" style={{ objectFit: "cover", borderRadius: 10, border: "1px solid #e6d7cc" }} />
                  <button
                    type="button"
                    className="btn"
                    onClick={() => removeImage(url)}
                    style={{ position: "absolute", right: 4, top: 4, padding: "0.15rem 0.45rem", fontSize: 12 }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
          <input type="file" accept="image/*" multiple onChange={onUpload} />
          <small className="muted">Tu peux selectionner plusieurs images. N'oublie pas Enregistrer.</small>
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
