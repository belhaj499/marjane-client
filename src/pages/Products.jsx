/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import {
  PRODUCT_CACHE_INVALIDATED_EVENT,
  PRODUCT_CACHE_VERSION_KEY,
  readCache,
  writeCache,
  warmupFirstProductsPage,
  warmupProductsPage,
  warmupProductsPool,
  warmupProductsPoolInBackground,
} from "../utils/productsWarmup";

const genderMeta = {
  HOMME: { path: "/homme", label: "Homme", pageClass: "page page-homme" },
  FEMME: { path: "/femme", label: "Femme", pageClass: "page page-femme" },
  UNISEX: { path: "/unisex", label: "Unisex", pageClass: "page page-unisex" },
};

const keepVisibleProducts = (items) =>
  (items || []).filter((product) => product?.active !== false);

const Products = ({ gender }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialBrand = searchParams.get("brand") || "";
  const initialSort =
    searchParams.get("sort") === "price,desc" ? "price,desc" : "price,asc";
  const initialPage = Math.max((Number(searchParams.get("page")) || 1) - 1, 0);

  const [brand, setBrand] = useState(initialBrand);
  const [sort, setSort] = useState(initialSort);
  const [size] = useState(12);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [debouncedBrand, setDebouncedBrand] = useState("");
  const [searchPool, setSearchPool] = useState([]);
  const [searchPoolReady, setSearchPoolReady] = useState(false);
  const listTopRef = useRef(null);
  const hasMountedRef = useRef(false);
  const prevFiltersRef = useRef({
    gender,
    debouncedBrand,
    sort,
    size,
  });

  const filterByBrand = (items, query) => {
    const q = String(query || "").trim().toLowerCase();
    const visibleItems = keepVisibleProducts(items);
    if (!q) return visibleItems;
    return visibleItems.filter((p) => {
      const brandText = String(p.brand || "").toLowerCase();
      const nameText = String(p.name || "").toLowerCase();
      return brandText.includes(q) || nameText.includes(q);
    });
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBrand(brand);
    }, 100);
    return () => clearTimeout(timer);
  }, [brand]);

  useEffect(() => {
    const handleInvalidation = () => {
      setSearchPool([]);
      setSearchPoolReady(false);
      setData({ content: [], totalPages: 0, number: 0 });
      setRefreshVersion((value) => value + 1);
    };

    const handleStorage = (event) => {
      if (event.key === PRODUCT_CACHE_VERSION_KEY) {
        handleInvalidation();
      }
    };

    window.addEventListener(PRODUCT_CACHE_INVALIDATED_EVENT, handleInvalidation);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PRODUCT_CACHE_INVALIDATED_EVENT, handleInvalidation);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    // Reset search pool when context changes. We only load full pool on-demand (when searching).
    setSearchPool([]);
    setSearchPoolReady(false);

    let mounted = true;
    // Warm search pool in background so search feels instant once user types.
    warmupProductsPoolInBackground({ gender, sort })
      .then((items) => {
        if (!mounted) return;
        setSearchPool(keepVisibleProducts(items));
        setSearchPoolReady(true);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [gender, sort, refreshVersion]);

  useEffect(() => {
    const otherGenders = Object.keys(genderMeta).filter((item) => item !== gender);
    // Warm next likely navigation target to avoid long wait when switching tabs.
    Promise.allSettled(
      otherGenders.map((targetGender) => warmupFirstProductsPage({ gender: targetGender, sort }))
    ).catch(() => {});
  }, [gender, sort]);

  useEffect(() => {
    let mounted = true;
    const hasBrandFilter = debouncedBrand.trim().length > 0;
    if (!hasBrandFilter) {
      return () => {
        mounted = false;
      };
    }

    const poolCacheKey = `products-pool|${gender}|${sort}`;
    const cached = readCache(poolCacheKey);
    if (cached) {
      setSearchPool(keepVisibleProducts(Array.isArray(cached) ? cached : []));
      setSearchPoolReady(true);
      return () => {
        mounted = false;
      };
    }

    setSearchPoolReady(false);
    warmupProductsPool({ gender, sort })
      .then((items) => {
        if (!mounted) return;
        setSearchPool(keepVisibleProducts(items));
        setSearchPoolReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        setSearchPool([]);
        setSearchPoolReady(false);
      });

    return () => {
      mounted = false;
    };
  }, [gender, sort, debouncedBrand, refreshVersion]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setError("");

    const hasBrandFilter = debouncedBrand.trim().length > 0;

    if (hasBrandFilter) {
      if (!searchPoolReady) {
        // Do not block UI while full search pool is still warming in background.
        setLoading(false);
        return () => {
          mounted = false;
        };
      }

      const filtered = filterByBrand(searchPool, debouncedBrand);
      const uniqueFiltered = uniqueById(filtered);
      const totalPages = Math.ceil(uniqueFiltered.length / size);
      const safePage = Math.min(page, Math.max(totalPages - 1, 0));
      const start = safePage * size;
      const content = uniqueFiltered.slice(start, start + size);
      setData({
        content,
        number: safePage,
        totalPages,
      });
      if (safePage !== page) {
        setPage(safePage);
      }
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const pageCacheKey = `products|${gender}|${sort}|${page}|${size}`;
    const cached = readCache(pageCacheKey);
    if (cached) {
      setData({
        ...cached,
        content: uniqueById(keepVisibleProducts(cached?.content || [])),
      });
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);

    getProducts({ gender, page, size, sort, signal: controller.signal })
      .then((res) => {
        if (!mounted) return;
        const next = {
          ...res,
          content: uniqueById(keepVisibleProducts(res?.content || [])),
        };
        setData(next);
        writeCache(pageCacheKey, next);
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
          return;
        }
        if (mounted) setError("Echec du chargement des produits");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [gender, debouncedBrand, page, size, sort, searchPool, searchPoolReady, refreshVersion]);

  useEffect(() => {
    if (debouncedBrand.trim()) return;
    const totalPages = Number(data?.totalPages || 0);
    if (totalPages <= 1) return;

    const toWarm = [];
    if (page + 1 < totalPages) toWarm.push(page + 1);
    if (page - 1 >= 0) toWarm.push(page - 1);

    toWarm.forEach((targetPage) => {
      warmupProductsPage({
        gender,
        page: targetPage,
        size,
        sort,
      }).catch(() => {});
    });
  }, [debouncedBrand, data?.totalPages, gender, page, size, sort, refreshVersion]);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const changed =
      prev.gender !== gender ||
      prev.debouncedBrand !== debouncedBrand ||
      prev.sort !== sort ||
      prev.size !== size;

    if (changed) {
      setPage(0);
    }

    prevFiltersRef.current = {
      gender,
      debouncedBrand,
      sort,
      size,
    };
  }, [gender, debouncedBrand, sort, size]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (brand.trim()) next.set("brand", brand.trim());
    if (sort !== "price,asc") next.set("sort", sort);
    if (page > 0) next.set("page", String(page + 1));
    setSearchParams(next, { replace: true });
  }, [brand, sort, page, setSearchParams]);

  useEffect(() => {
    const path = genderMeta[gender]?.path || "/";
    const next = new URLSearchParams();
    if (brand.trim()) next.set("brand", brand.trim());
    if (sort !== "price,asc") next.set("sort", sort);
    if (page > 0) next.set("page", String(page + 1));
    const query = next.toString();
    const full = query ? `${path}?${query}` : path;
    try {
      sessionStorage.setItem("last-products-route", full);
    } catch {
      // Ignore storage failures.
    }
  }, [gender, brand, sort, page]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page, debouncedBrand, sort, gender]);

  const pageClass = genderMeta[gender]?.pageClass || "page";
  const hasBrandFilter = debouncedBrand.trim().length > 0;
  const fallbackSearchContent =
    hasBrandFilter && !searchPoolReady
      ? uniqueById(filterByBrand(data.content || [], debouncedBrand))
      : keepVisibleProducts(data.content || []);
  const effectiveData =
    hasBrandFilter && !searchPoolReady
      ? {
          ...data,
          content: fallbackSearchContent,
          number: 0,
          totalPages: 0,
        }
      : data;
  const fromPath = (() => {
    const path = genderMeta[gender]?.path || "/";
    const next = new URLSearchParams();
    if (brand.trim()) next.set("brand", brand.trim());
    if (sort !== "price,asc") next.set("sort", sort);
    if (page > 0) next.set("page", String(page + 1));
    const query = next.toString();
    return query ? `${path}?${query}` : path;
  })();
  const showGlobalSpinner = loading && !(hasBrandFilter && !searchPoolReady);
  const showEmptyState = !loading && !error && (effectiveData.content?.length || 0) === 0;

  return (
    <>
      <div className={pageClass}>
        <h1 ref={listTopRef}>Parfums {genderMeta[gender]?.label || gender}</h1>
        <Filters
          brand={brand}
          setBrand={setBrand}
          sort={sort}
          setSort={setSort}
        />

        {error && <p className="error">{error}</p>}

        <div className="products-stage">
          {showEmptyState ? (
            <div className="products-empty">
              <h2>Aucun parfum trouve</h2>
              <p>
                {hasBrandFilter
                  ? `Aucun resultat pour "${brand.trim()}". Essayez un autre nom ou effacez la recherche.`
                  : "Aucun parfum disponible pour le moment."}
              </p>
              {hasBrandFilter && (
                <button className="btn btn-primary" onClick={() => setBrand("")}>
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="grid">
              {effectiveData.content?.map((p) => (
                <ProductCard key={p.id} product={p} fromPath={fromPath} />
              ))}
            </div>
          )}
        </div>

        <Pagination
          page={effectiveData.number || page}
          totalPages={effectiveData.totalPages || 0}
          onPageChange={setPage}
          loading={loading}
        />
      </div>

      {showGlobalSpinner &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="products-loading-screen" role="status" aria-live="polite" aria-label="Chargement des produits">
            <span className="products-loading-spinner products-loading-spinner-xl" aria-hidden="true" />
          </div>,
          document.body
        )}
    </>
  );
};

export default Products;
