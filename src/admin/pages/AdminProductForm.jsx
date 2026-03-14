import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  createAdminProduct,
  getAdminProductById,
  syncAdminProductImages,
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

const makePendingImage = (file) => ({
  file,
  previewUrl: URL.createObjectURL(file),
});

const revokePendingImage = (image) => {
  if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
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
  const [pendingPrimaryImage, setPendingPrimaryImage] = useState(null);
  const [pendingGalleryImages, setPendingGalleryImages] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);
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

  useEffect(
    () => () => {
      revokePendingImage(pendingPrimaryImage);
      pendingGalleryImages.forEach(revokePendingImage);
    },
    [pendingGalleryImages, pendingPrimaryImage]
  );

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

  const clearPendingUploads = () => {
    revokePendingImage(pendingPrimaryImage);
    pendingGalleryImages.forEach(revokePendingImage);
    setPendingPrimaryImage(null);
    setPendingGalleryImages([]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const payload = buildPayload();
      let productId = id;
      let currentProduct = null;

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
        const hasPendingUploads = Boolean(pendingPrimaryImage) || pendingGalleryImages.length > 0;

        if (Object.keys(changedPayload).length === 0 && !galleryChanged && !hasPendingUploads) {
          setMessage("Aucune modification detectee");
          return;
        }

        if (Object.keys(changedPayload).length > 0 || galleryChanged) {
          currentProduct = await updateAdminProduct(id, { ...changedPayload, imageUrls });
        } else {
          currentProduct = await getAdminProductById(id);
        }
      } else {
        currentProduct = await createAdminProduct(payload);
        productId = currentProduct.id;
      }

      if (pendingPrimaryImage?.file && productId) {
        currentProduct = await uploadAdminProductImage(productId, pendingPrimaryImage.file);
      }

      if (pendingGalleryImages.length > 0 && productId) {
        currentProduct = await uploadAdminProductImages(
          productId,
          pendingGalleryImages.map((image) => image.file)
        );
      }

      if (productId) {
        const refreshed = currentProduct || (await getAdminProductById(productId));
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

      clearPendingUploads();
      setMessage(isEdit ? "Produit mis a jour" : "Produit cree");
      navigate("/admin/products", { replace: true });
    } catch {
      setMessage("Echec de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const onSelectPrimaryImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    revokePendingImage(pendingPrimaryImage);
    setPendingPrimaryImage(makePendingImage(file));
    setMessage("Image principale selectionnee. Clique sur Enregistrer pour l'envoyer.");
    e.target.value = "";
  };

  const onSelectGalleryImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingGalleryImages((prev) => [...prev, ...files.map(makePendingImage)]);
    setMessage("Images secondaires selectionnees. Clique sur Enregistrer pour les envoyer.");
    e.target.value = "";
  };

  const removeImage = (imageToRemove) => {
    setImageUrls((prev) => {
      const next = prev.filter((url) => url !== imageToRemove);
      setForm((curr) => ({ ...curr, imageUrl: next[0] || "" }));
      return next;
    });
  };

  const removePendingPrimaryImage = () => {
    revokePendingImage(pendingPrimaryImage);
    setPendingPrimaryImage(null);
  };

  const removePendingGalleryImage = (previewUrl) => {
    setPendingGalleryImages((prev) => {
      const image = prev.find((item) => item.previewUrl === previewUrl);
      revokePendingImage(image);
      return prev.filter((item) => item.previewUrl !== previewUrl);
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
            <div className="image-preview-list">
              <div className="image-preview-card">
                <button
                  type="button"
                  className="image-preview-zoom"
                  onClick={() =>
                    setZoomedImage({
                      src: buildImageUrl(imageUrls[0]),
                      alt: "Image principale",
                    })
                  }
                >
                  <img
                    src={buildImageUrl(imageUrls[0])}
                    alt="Image principale"
                    width="90"
                    height="90"
                    className="image-preview-thumb"
                  />
                </button>
                <button
                  type="button"
                  className="image-preview-remove"
                  onClick={() => removeImage(imageUrls[0])}
                >
                  x
                </button>
              </div>
            </div>
          )}
          {pendingPrimaryImage && (
            <div className="pending-upload-block">
              <p className="pending-upload-label">Nouvelle image principale selectionnee</p>
              <div className="image-preview-list">
                <div className="image-preview-card">
                  <button
                    type="button"
                    className="image-preview-zoom"
                    onClick={() =>
                      setZoomedImage({
                        src: pendingPrimaryImage.previewUrl,
                        alt: pendingPrimaryImage.file.name,
                      })
                    }
                  >
                    <img
                      src={pendingPrimaryImage.previewUrl}
                      alt={pendingPrimaryImage.file.name}
                      width="90"
                      height="90"
                      className="image-preview-thumb"
                    />
                  </button>
                  <button
                    type="button"
                    className="image-preview-remove"
                    onClick={removePendingPrimaryImage}
                  >
                    x
                  </button>
                </div>
              </div>
            </div>
          )}
          <input type="file" accept="image/*" onChange={onSelectPrimaryImage} />
          <small className="muted">
            Cette image sera la photo principale du parfum. L'envoi se fait apres clic sur
            Enregistrer.
          </small>
        </div>

        <div className="field">
          <label>Images secondaires</label>
          {imageUrls.length > 1 && (
            <div className="image-preview-list">
              {imageUrls.slice(1).map((url, idx) => (
                <div key={`${url}-${idx}`} className="image-preview-card">
                  <button
                    type="button"
                    className="image-preview-zoom"
                    onClick={() =>
                      setZoomedImage({
                        src: buildImageUrl(url),
                        alt: `Produit secondaire ${idx + 1}`,
                      })
                    }
                  >
                    <img
                      src={buildImageUrl(url)}
                      alt={`Produit secondaire ${idx + 1}`}
                      width="90"
                      height="90"
                      className="image-preview-thumb"
                    />
                  </button>
                  <button
                    type="button"
                    className="image-preview-remove"
                    onClick={() => removeImage(url)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
          {pendingGalleryImages.length > 0 && (
            <div className="pending-upload-block">
              <p className="pending-upload-label">
                {pendingGalleryImages.length} image(s) secondaire(s) selectionnee(s)
              </p>
              <div className="image-preview-list">
                {pendingGalleryImages.map((image) => (
                  <div key={image.previewUrl} className="image-preview-card">
                    <button
                      type="button"
                      className="image-preview-zoom"
                      onClick={() =>
                        setZoomedImage({
                          src: image.previewUrl,
                          alt: image.file.name,
                        })
                      }
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.file.name}
                        width="90"
                        height="90"
                        className="image-preview-thumb"
                      />
                    </button>
                    <button
                      type="button"
                      className="image-preview-remove"
                      onClick={() => removePendingGalleryImage(image.previewUrl)}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <input type="file" accept="image/*" multiple onChange={onSelectGalleryImages} />
          <small className="muted">
            Ces images apparaitront apres la photo principale. L'envoi se fait apres clic sur
            Enregistrer.
          </small>
        </div>

        <div className="card-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "En cours..." : "Enregistrer"}
          </button>
          <Link className="btn" to="/admin/products">
            Retour
          </Link>
        </div>

        {message && <p className="message">{message}</p>}
      </form>

      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <div className="image-zoom-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="image-zoom-close"
              onClick={() => setZoomedImage(null)}
            >
              x
            </button>
            <img className="image-zoom-full" src={zoomedImage.src} alt={zoomedImage.alt} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductForm;
