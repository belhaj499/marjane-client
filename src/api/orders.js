import api from "./axios";

export const createOrder = async (payload) => {
  const rawBaseUrl = import.meta.env.VITE_API_URL || "";
  const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
  const ordersPath = /\/api$/i.test(normalizedBaseUrl) ? "/orders" : "/api/orders";
  const res = await api.post(ordersPath, payload);
  return res.data;
};
