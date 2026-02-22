import api from "./axios";

const cleanParams = (params) => {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export const getProducts = async ({ gender, brand, page, size, sort }) => {
  const params = cleanParams({ gender, brand, page, size, sort });
  const res = await api.get("/api/products", { params });
  return res.data;
};

export const getProductById = async (id) => {
  const res = await api.get(`/api/products/${id}`);
  return res.data;
};
