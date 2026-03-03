/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import {
  readCache,
  writeCache,
  warmupFirstProductsPage,
  warmupProductsPage,
  warmupProductsPool,
  warmupProductsPoolInBackground,
} from "../utils/productsWarmup";

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
    if (!q) return items || [];
    return (items || []).filter((p) => {
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
    // Reset search pool when context changes. We only load full pool on-demand (when searching).
    setSearchPool([]);
    setSearchPoolReady(false);

    let mounted = true;
    // Warm search pool in background so search feels instant once user types.
    warmupProductsPoolInBackground({ gender, sort })
      .then((items) => {
        if (!mounted) return;
        setSearchPool(items);
        setSearchPoolReady(true);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [gender, sort]);

  useEffect(() => {
    const otherGender = gender === "HOMME" ? "FEMME" : "HOMME";
    // Warm next likely navigation target to avoid long wait when switching tabs.
    warmupFirstProductsPage({ gender: otherGender, sort }).catch(() => {});
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
      setSearchPool(Array.isArray(cached) ? cached : []);
      setSearchPoolReady(true);
      return () => {
        mounted = false;
      };
    }

    setSearchPoolReady(false);
    warmupProductsPool({ gender, sort })
      .then((items) => {
        if (!mounted) return;
        setSearchPool(items);
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
  }, [gender, sort, debouncedBrand]);

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
        content: uniqueById(cached?.content || []),
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
          content: uniqueById(res?.content || []),
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
  }, [gender, debouncedBrand, page, size, sort, searchPool, searchPoolReady]);

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
  }, [debouncedBrand, data?.totalPages, gender, page, size, sort]);

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
    const path = gender === "HOMME" ? "/homme" : "/femme";
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

  const pageClass =
    gender === "HOMME" ? "page page-homme" : "page page-femme";
  const hasBrandFilter = debouncedBrand.trim().length > 0;
  const fallbackSearchContent =
    hasBrandFilter && !searchPoolReady
      ? uniqueById(filterByBrand(data.content || [], debouncedBrand))
      : data.content || [];
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
    const path = gender === "HOMME" ? "/homme" : "/femme";
    const next = new URLSearchParams();
    if (brand.trim()) next.set("brand", brand.trim());
    if (sort !== "price,asc") next.set("sort", sort);
    if (page > 0) next.set("page", String(page + 1));
    const query = next.toString();
    return query ? `${path}?${query}` : path;
  })();
  const showGlobalSpinner = loading && !(hasBrandFilter && !searchPoolReady);

  return (
    <>
      <div className={pageClass}>
        <h1 ref={listTopRef}>Parfums {gender === "HOMME" ? "Homme" : "Femme"}</h1>
        <Filters
          brand={brand}
          setBrand={setBrand}
          sort={sort}
          setSort={setSort}
        />

        {error && <p className="error">{error}</p>}

        <div className="products-stage">
          <div className="grid">
            {effectiveData.content?.map((p) => (
              <ProductCard key={p.id} product={p} fromPath={fromPath} />
            ))}
          </div>
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
