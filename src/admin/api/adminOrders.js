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

export const getAdminOrders = async ({ page, size, status, sort }) => {
  const params = cleanParams({ page, size, status, sort });
  const res = await adminApi.get("/api/orders", { params });
  return res.data;
};

export const getAdminOrderById = async (id) => {
  const res = await adminApi.get(`/api/orders/${id}`);
  return res.data;
};

export const updateAdminOrderStatus = async (id, status) => {
  const res = await adminApi.put(`/api/orders/${id}/status`, null, {
    params: { status },
  });
  return res.data;
};

export const getAdminOrderWhatsapp = async (id) => {
  const res = await adminApi.get(`/api/orders/${id}/whatsapp`);
  return res.data;
};

export const deleteAdminOrder = async (id) => {
  const res = await adminApi.delete(`/api/orders/${id}`);
  return res.data;
};
