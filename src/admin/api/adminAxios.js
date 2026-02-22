import axios from "axios";
import { API } from "../../api";
import { getAdminCredentials } from "../auth/adminAuth";

const adminApi = axios.create({
  baseURL: API,
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
