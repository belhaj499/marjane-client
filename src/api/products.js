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

const serializeParams = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
      return;
    }
    search.append(key, String(value));
  });
  return search.toString();
};

const stableSort = (sort) => {
  const primary = String(sort || "price,asc").trim();
  // Add deterministic tiebreaker to avoid duplicate/missing rows across pages.
  return [primary, "id,asc"];
};

export const getProducts = async ({ gender, brand, page, size, sort, signal }) => {
  const params = cleanParams({
    gender,
    brand,
    page,
    size,
    sort: stableSort(sort),
  });
  const res = await api.get("/api/products", {
    params,
    paramsSerializer: serializeParams,
    signal,
  });
  return res.data;
};

export const getProductById = async (id) => {
  const res = await api.get(`/api/products/${id}`);
  return res.data;
};
