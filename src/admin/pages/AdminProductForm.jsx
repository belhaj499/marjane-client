import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  createAdminProduct,
  getAdminProductById,
  updateAdminProduct,
  uploadAdminProductImage,
  uploadAdminProductImages,
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
import { invalidateProductCaches } from "../../utils/productsWarmup";

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

const resolveImages = (product) => {
  const fromApi = Array.isArray(product?.imageUrls) ? product.imageUrls.filter(Boolean) : [];
  if (fromApi.length > 0) return fromApi;

  const fromDescription = extractImageUrls(product?.description);
  if (fromDescription.length > 0) return fromDescription;

  return product?.imageUrl ? [product.imageUrl] : [];
};

const areSameImages = (a = [], b = []) => {
  const left = (a || []).filter(Boolean);
  const right = (b || []).filter(Boolean);
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const hydrateProductState = ({
  product,
  setForm,
  setInitialForm,
  setSeasonTags,
  setInitialSeasonTags,
  setWearTags,
  setInitialWearTags,
  setImageUrls,
  setInitialImageUrls,
}) => {
  const tags = extractSeasonTags(product?.description);
  const wear = extractWearTags(product?.description);
  const images = resolveImages(product);
  const cleanedDescription = stripProductMeta(product?.description);
  const next = { ...product, description: cleanedDescription };

  setForm(next);
  setInitialForm(next);
  setSeasonTags(tags);
  setInitialSeasonTags(tags);
  setWearTags(wear);
  setInitialWearTags(wear);
  setImageUrls(images);
  setInitialImageUrls(images);
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
      .then((res) =>
        hydrateProductState({
          product: res,
          setForm,
          setInitialForm,
          setSeasonTags,
          setInitialSeasonTags,
          setWearTags,
          setInitialWearTags,
          setImageUrls,
          setInitialImageUrls,
        })
      )
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
    description: attachProductMeta(String(form.description || "").trim(), seasonTags, wearTags, []),
    imageUrl: imageUrls[0] || form.imageUrl || "",
    imageUrls,
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
      "imageUrls",
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
            String(initialForm.description || "").trim(),
            initialSeasonTags,
            initialWearTags,
            []
          ),
          imageUrl: initialImageUrls[0] || initialForm.imageUrl || "",
          imageUrls: initialImageUrls,
          price: Number(initialForm.price),
          stock: Number(initialForm.stock),
          volumeMl: Number(initialForm.volumeMl),
        };
        const changedPayload = buildChangedPayload(payload, previous);
        const galleryChanged = !areSameImages(imageUrls, initialImageUrls);

        if (Object.keys(changedPayload).length === 0 && !galleryChanged) {
          setMessage("Aucune modification detectee");
          setLoading(false);
          return;
        }
        let updated = null;
        if (Object.keys(changedPayload).length > 0 || galleryChanged) {
          const payloadWithGallery = { ...changedPayload, imageUrls };
          updated = await updateAdminProduct(id, payloadWithGallery);
        }
        if (updated) {
          invalidateProductCaches();
          hydrateProductState({
            product: updated,
            setForm,
            setInitialForm,
            setSeasonTags,
            setInitialSeasonTags,
            setWearTags,
            setInitialWearTags,
            setImageUrls,
            setInitialImageUrls,
          });
        } else {
          const refreshed = await getAdminProductById(id);
          invalidateProductCaches();
          hydrateProductState({
            product: refreshed,
            setForm,
            setInitialForm,
            setSeasonTags,
            setInitialSeasonTags,
            setWearTags,
            setInitialWearTags,
            setImageUrls,
            setInitialImageUrls,
          });
        }
        setMessage("Produit mis a jour");
        navigate("/admin/products", { replace: true });
      } else {
        await createAdminProduct(payload);
        invalidateProductCaches();
        navigate("/admin/products", { replace: true });
      }
    } catch {
      setMessage("Echec de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const ensureProductExistsForUpload = async () => {
    if (id) return id;
    if (!form.name || !form.brand) {
      setMessage("Remplir au moins Nom et Marque avant l'upload.");
      return null;
    }

    const created = await createAdminProduct(buildPayload());
    hydrateProductState({
      product: created,
      setForm,
      setInitialForm,
      setSeasonTags,
      setInitialSeasonTags,
      setWearTags,
      setInitialWearTags,
      setImageUrls,
      setInitialImageUrls,
    });

    if (!isEdit) navigate(`/admin/products/${created.id}/edit`, { replace: true });
    return created.id;
  };

  const onUploadPrimaryImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage("");
    setLoading(true);
    try {
      const productId = await ensureProductExistsForUpload();
      if (!productId) return;

      const updated = await uploadAdminProductImage(productId, file);
      invalidateProductCaches();
      hydrateProductState({
        product: updated,
        setForm,
        setInitialForm,
        setSeasonTags,
        setInitialSeasonTags,
        setWearTags,
        setInitialWearTags,
        setImageUrls,
        setInitialImageUrls,
      });
      setMessage("Image principale telechargee.");
    } catch {
      setMessage("Echec upload image principale");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const onUploadGalleryImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setMessage("");
    setLoading(true);
    try {
      const productId = await ensureProductExistsForUpload();
      if (!productId) return;

      const updated = await uploadAdminProductImages(productId, files);
      invalidateProductCaches();
      hydrateProductState({
        product: updated,
        setForm,
        setInitialForm,
        setSeasonTags,
        setInitialSeasonTags,
        setWearTags,
        setInitialWearTags,
        setImageUrls,
        setInitialImageUrls,
      });
      setMessage(files.length > 1 ? "Images secondaires telechargees." : "Image secondaire telechargee.");
    } catch {
      setMessage("Echec upload images secondaires");
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
            <option value="UNISEX">Unisex</option>
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
          <input
            name="volumeMl"
            type="number"
            min="1"
            step="1"
            value={form.volumeMl}
            onChange={onChange}
            placeholder="Ex: 75"
          />
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
          <label>Image principale</label>
          {imageUrls[0] && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <div style={{ position: "relative" }}>
                <img src={buildImageUrl(imageUrls[0])} alt="Image principale" width="90" height="90" style={{ objectFit: "cover", borderRadius: 10, border: "1px solid #e6d7cc" }} />
                <button
                  type="button"
                  className="btn"
                  onClick={() => removeImage(imageUrls[0])}
                  style={{ position: "absolute", right: 4, top: 4, padding: "0.15rem 0.45rem", fontSize: 12 }}
                >
                  x
                </button>
              </div>
            </div>
          )}
          <input type="file" accept="image/*" onChange={onUploadPrimaryImage} />
          <small className="muted">Cette image sera la photo principale du parfum.</small>
        </div>

        <div className="field">
          <label>Images secondaires</label>
          {imageUrls.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {imageUrls.slice(1).map((url, idx) => (
                <div key={`${url}-${idx}`} style={{ position: "relative" }}>
                  <img src={buildImageUrl(url)} alt={`Produit secondaire ${idx + 1}`} width="90" height="90" style={{ objectFit: "cover", borderRadius: 10, border: "1px solid #e6d7cc" }} />
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
          <input type="file" accept="image/*" multiple onChange={onUploadGalleryImages} />
          <small className="muted">Ces images apparaitront apres la photo principale. N'oublie pas Enregistrer.</small>
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
