import { getProducts } from "../api/products";

export const CACHE_TTL_MS = 10 * 60 * 1000;
export const ADMIN_CACHE_TTL_MS = 10 * 60 * 1000;
export const SEARCH_POOL_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 12;

const inflight = new Map();
const LOCAL_PREFIX = "marjane_cache|";

const uniqueById = (items) => {
  const seen = new Set();
  return (items || []).filter((p) => {
    const id = p?.id;
    if (id === undefined || id === null) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const readCacheWithTtl = (key, ttlMs = CACHE_TTL_MS) => {
  try {
    const sessionRaw = sessionStorage.getItem(key);
    const localRaw = localStorage.getItem(`${LOCAL_PREFIX}${key}`);
    const raw = sessionRaw || localRaw;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > ttlMs) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(`${LOCAL_PREFIX}${key}`);
      return null;
    }
    // Sync between storages so following reads are immediate.
    if (!sessionRaw) {
      sessionStorage.setItem(key, raw);
    }
    return parsed.data || null;
  } catch {
    return null;
  }
};

export const readCache = (key) => readCacheWithTtl(key, CACHE_TTL_MS);

export const writeCache = (key, data) => {
  const payload = JSON.stringify({
    savedAt: Date.now(),
    data,
  });
  try {
    sessionStorage.setItem(key, payload);
  } catch {
    // Ignore storage failures.
  }
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${key}`, payload);
  } catch {
    // Ignore storage failures.
  }
};

export const warmupProductsPool = async ({
  gender,
  sort = "price,asc",
  pageSize = SEARCH_POOL_PAGE_SIZE,
}) => {
  const poolCacheKey = `products-pool|${gender}|${sort}`;
  const cached = readCache(poolCacheKey);
  if (cached) return uniqueById(Array.isArray(cached) ? cached : []);

  if (inflight.has(poolCacheKey)) {
    return inflight.get(poolCacheKey);
  }

  const promise = (async () => {
    const first = await getProducts({
      gender,
      page: 0,
      size: pageSize,
      sort,
    });

    let items = [...(first?.content || [])];
    const totalPages = Number(first?.totalPages || 1);

    if (totalPages > 1) {
      const requests = [];
      for (let p = 1; p < totalPages; p += 1) {
        requests.push(
          getProducts({
            gender,
            page: p,
            size: pageSize,
            sort,
          })
        );
      }
      const rest = await Promise.all(requests);
      rest.forEach((res) => {
        items = items.concat(res?.content || []);
      });
    }

    const uniqueItems = uniqueById(items);
    writeCache(poolCacheKey, uniqueItems);

    const firstPageCacheKey = `products|${gender}|${sort}|0|${DEFAULT_PAGE_SIZE}`;
    writeCache(firstPageCacheKey, {
      content: uniqueItems.slice(0, DEFAULT_PAGE_SIZE),
      number: 0,
      totalPages: Math.ceil(uniqueItems.length / DEFAULT_PAGE_SIZE),
      totalElements: uniqueItems.length,
      size: DEFAULT_PAGE_SIZE,
    });

    return uniqueItems;
  })().finally(() => {
    inflight.delete(poolCacheKey);
  });

  inflight.set(poolCacheKey, promise);
  return promise;
};

export const warmupFirstProductsPage = async ({
  gender,
  sort = "price,asc",
  size = DEFAULT_PAGE_SIZE,
}) => {
  const pageCacheKey = `products|${gender}|${sort}|0|${size}`;
  const cached = readCache(pageCacheKey);
  if (cached) return cached;

  const inflightKey = `first-page|${gender}|${sort}|${size}`;
  if (inflight.has(inflightKey)) {
    return inflight.get(inflightKey);
  }

  const promise = getProducts({ gender, page: 0, size, sort })
    .then((res) => {
      writeCache(pageCacheKey, res);
      return res;
    })
    .finally(() => {
      inflight.delete(inflightKey);
    });

  inflight.set(inflightKey, promise);
  return promise;
};

export const warmupProductsPage = async ({
  gender,
  page = 0,
  sort = "price,asc",
  size = DEFAULT_PAGE_SIZE,
}) => {
  const safePage = Math.max(Number(page) || 0, 0);
  const pageCacheKey = `products|${gender}|${sort}|${safePage}|${size}`;
  const cached = readCache(pageCacheKey);
  if (cached) return cached;

  const inflightKey = `page|${gender}|${sort}|${safePage}|${size}`;
  if (inflight.has(inflightKey)) {
    return inflight.get(inflightKey);
  }

  const promise = getProducts({ gender, page: safePage, size, sort })
    .then((res) => {
      writeCache(pageCacheKey, res);
      return res;
    })
    .finally(() => {
      inflight.delete(inflightKey);
    });

  inflight.set(inflightKey, promise);
  return promise;
};

const runWhenIdle = (cb) => {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => cb());
    return;
  }
  setTimeout(cb, 250);
};

export const warmupProductsPoolInBackground = ({
  gender,
  sort = "price,asc",
  pageSize = SEARCH_POOL_PAGE_SIZE,
}) => {
  const poolCacheKey = `products-pool|${gender}|${sort}`;
  const cached = readCache(poolCacheKey);
  if (cached) return Promise.resolve(uniqueById(Array.isArray(cached) ? cached : []));

  if (inflight.has(poolCacheKey)) {
    return inflight.get(poolCacheKey);
  }

  const promise = (async () => {
    const first = await warmupFirstProductsPage({
      gender,
      sort,
      size: DEFAULT_PAGE_SIZE,
    });

    const firstLarge = await getProducts({
      gender,
      page: 0,
      size: pageSize,
      sort,
    });

    let items = [...(firstLarge?.content || first?.content || [])];
    const totalPages = Number(firstLarge?.totalPages || 1);

    for (let p = 1; p < totalPages; p += 1) {
      // Spread requests over time so home remains responsive.
      const res = await getProducts({
        gender,
        page: p,
        size: pageSize,
        sort,
      });
      items = items.concat(res?.content || []);
      await new Promise((resolve) => runWhenIdle(resolve));
    }

    const uniqueItems = uniqueById(items);
    writeCache(poolCacheKey, uniqueItems);
    return uniqueItems;
  })().finally(() => {
    inflight.delete(poolCacheKey);
  });

  inflight.set(poolCacheKey, promise);
  return promise;
};
