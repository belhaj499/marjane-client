import { getProducts } from "../api/products";

export const CACHE_TTL_MS = 5 * 60 * 1000;
export const SEARCH_POOL_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 12;

const inflight = new Map();

export const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data || null;
  } catch {
    return null;
  }
};

export const writeCache = (key, data) => {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    );
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
  if (cached) return Array.isArray(cached) ? cached : [];

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

    writeCache(poolCacheKey, items);

    const firstPageCacheKey = `products|${gender}|${sort}|0|${DEFAULT_PAGE_SIZE}`;
    writeCache(firstPageCacheKey, {
      content: items.slice(0, DEFAULT_PAGE_SIZE),
      number: 0,
      totalPages: Math.ceil(items.length / DEFAULT_PAGE_SIZE),
      totalElements: items.length,
      size: DEFAULT_PAGE_SIZE,
    });

    return items;
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
  if (cached) return Promise.resolve(Array.isArray(cached) ? cached : []);

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

    writeCache(poolCacheKey, items);
    return items;
  })().finally(() => {
    inflight.delete(poolCacheKey);
  });

  inflight.set(poolCacheKey, promise);
  return promise;
};
