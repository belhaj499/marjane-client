import adminApi from "./adminAxios";

const cleanParams = (params) => {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export const getAdminProducts = async ({ page, size, gender, brand, sort }) => {
  const params = cleanParams({ page, size, gender, brand, sort, _ts: Date.now() });
  const res = await adminApi.get("/api/products", { params });
  return res.data;
};

export const getAdminProductById = async (id) => {
  const res = await adminApi.get(`/api/products/${id}`);
  return res.data;
};

export const createAdminProduct = async (payload) => {
  const res = await adminApi.post("/api/products", payload);
  return res.data;
};

export const updateAdminProduct = async (id, payload) => {
  const res = await adminApi.patch(`/api/products/${id}`, payload);
  return res.data;
};

export const syncAdminProductImages = async (id, imageUrls) => {
  const payload = { imageUrls };
  try {
    const res = await adminApi.patch(`/api/products/${id}/images`, payload);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    if (![404, 405].includes(status)) throw error;
  }

  try {
    const res = await adminApi.put(`/api/products/${id}/images`, payload);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    if (![404, 405].includes(status)) throw error;
  }

  const res = await adminApi.post(`/api/products/${id}/images/sync`, payload);
  return res.data;
};

export const deleteAdminProduct = async (id) => {
  const res = await adminApi.delete(`/api/products/${id}`);
  return res.data;
};

export const uploadAdminProductImage = async (id, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await adminApi.post(`/api/products/${id}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const uploadAdminProductImages = async (id, files) => {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  try {
    const res = await adminApi.post(`/api/products/${id}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const shouldFallback = [400, 404, 405, 415].includes(status);
    if (!shouldFallback) throw error;

    let lastData = null;
    for (const file of files) {
      const singleForm = new FormData();
      singleForm.append("file", file);
      const res = await adminApi.post(`/api/products/${id}/image`, singleForm, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      lastData = res.data;
    }
    return lastData;
  }
};
