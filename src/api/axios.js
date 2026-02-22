import api, { API } from "../api";

export const buildImageUrl = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (!API) return imageUrl;
  return `${API}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};

export default api;
