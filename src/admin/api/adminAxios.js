import axios from "axios";
import { getAdminCredentials } from "../auth/adminAuth";

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081",
});

adminApi.interceptors.request.use((config) => {
  const creds = getAdminCredentials();
  if (creds?.username && creds?.password) {
    const token = btoa(`${creds.username}:${creds.password}`);
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});

export default adminApi;
