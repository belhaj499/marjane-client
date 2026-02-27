const MARKER_SUFFIX = "]]";
const SEASON_PREFIX = "[[SEASONS:";
const WEAR_PREFIX = "[[WEAR:";
const IMAGES_PREFIX = "[[IMAGES:";

export const SEASON_OPTIONS = ["hiver", "printemps", "ete", "automne"];
export const WEAR_OPTIONS = ["jour", "nuit"];

const unique = (arr) => [...new Set(arr)];

const normalizeTags = (tags, allowed) =>
  unique((tags || []).map((tag) => String(tag).trim().toLowerCase())).filter((tag) =>
    allowed.includes(tag)
  );

const normalizeImageUrls = (urls) =>
  unique((urls || []).map((url) => String(url || "").trim()).filter(Boolean));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractTagsByPrefix = (description, prefix, allowed) => {
  const text = String(description || "");
  const start = text.lastIndexOf(prefix);
  if (start === -1) return [];
  const end = text.indexOf(MARKER_SUFFIX, start);
  if (end === -1) return [];

  const raw = text.slice(start + prefix.length, end);
  return normalizeTags(raw.split(","), allowed);
};

const stripMarker = (description, prefix) => {
  const text = String(description || "");
  const markerRegex = new RegExp(`${escapeRegExp(prefix)}[^\\]]*${escapeRegExp(MARKER_SUFFIX)}`, "g");
  return text.replace(markerRegex, "").replace(/\n{3,}/g, "\n\n").trim();
};

export const extractSeasonTags = (description) =>
  extractTagsByPrefix(description, SEASON_PREFIX, SEASON_OPTIONS);

export const extractWearTags = (description) => extractTagsByPrefix(description, WEAR_PREFIX, WEAR_OPTIONS);

export const stripSeasonMarker = (description) => stripMarker(description, SEASON_PREFIX);

export const stripWearMarker = (description) => stripMarker(description, WEAR_PREFIX);

export const extractImageUrls = (description) => {
  const text = String(description || "");
  const start = text.lastIndexOf(IMAGES_PREFIX);
  if (start === -1) return [];
  const end = text.indexOf(MARKER_SUFFIX, start);
  if (end === -1) return [];
  const raw = text.slice(start + IMAGES_PREFIX.length, end);
  return normalizeImageUrls(raw.split("|"));
};

export const stripImageMarker = (description) => stripMarker(description, IMAGES_PREFIX);

export const stripProductMeta = (description) =>
  stripImageMarker(stripWearMarker(stripSeasonMarker(description)));

export const attachProductMeta = (description, seasons, wear, images = []) => {
  const clean = stripProductMeta(description);
  const seasonTags = normalizeTags(seasons, SEASON_OPTIONS);
  const wearTags = normalizeTags(wear, WEAR_OPTIONS);
  const imageUrls = normalizeImageUrls(images);

  const markers = [];
  if (seasonTags.length > 0) markers.push(`${SEASON_PREFIX}${seasonTags.join(",")}${MARKER_SUFFIX}`);
  if (wearTags.length > 0) markers.push(`${WEAR_PREFIX}${wearTags.join(",")}${MARKER_SUFFIX}`);
  if (imageUrls.length > 0) markers.push(`${IMAGES_PREFIX}${imageUrls.join("|")}${MARKER_SUFFIX}`);

  if (markers.length === 0) return clean;
  return `${clean}\n\n${markers.join("\n")}`;
};

export const attachSeasonMarker = (description, seasons) => attachProductMeta(description, seasons, []);
