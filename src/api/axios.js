import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081",
});

export const buildImageUrl = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8081").replace(/\/$/, "");
  return `${base}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};

export default api;
