import axios from "axios";

export const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API,
});

export default api;
