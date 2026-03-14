import api, { API } from "../api";

const IMAGE_CACHE_VERSION_KEY = "marjane_cache|version";

const withCacheVersion = (url) => {
  if (!url) return "";
  try {
    const version = localStorage.getItem(IMAGE_CACHE_VERSION_KEY);
    if (!version) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(version)}`;
  } catch {
    return url;
  }
};

export const buildImageUrl = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return withCacheVersion(imageUrl);
  }
  if (!API) return withCacheVersion(imageUrl);
  return withCacheVersion(`${API}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`);
};

export default api;
