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
  try {
    const res = await adminApi.put(`/api/products/${id}`, payload);
    return res.data;
  } catch (err) {
    if (err?.response?.status !== 405) throw err;
  }
  const res = await adminApi.patch(`/api/products/${id}`, payload);
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
