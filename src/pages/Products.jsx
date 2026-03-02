/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import { readCache, writeCache, warmupProductsPool } from "../utils/productsWarmup";

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
  const hasDataRef = useRef(false);
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
    hasDataRef.current = (data.content || []).length > 0;
  }, [data.content]);

  useEffect(() => {
    let mounted = true;
    setError("");

    const hasBrandFilter = debouncedBrand.trim().length > 0;

    if (hasBrandFilter) {
      if (!searchPoolReady) {
        setLoading(true);
        return () => {
          mounted = false;
        };
      }

      const filtered = filterByBrand(searchPool, debouncedBrand);
      const totalPages = Math.ceil(filtered.length / size);
      const safePage = Math.min(page, Math.max(totalPages - 1, 0));
      const start = safePage * size;
      const content = filtered.slice(start, start + size);
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
      setData(cached);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(!hasDataRef.current);

    getProducts({ gender, page, size, sort })
      .then((res) => {
        if (!mounted) return;
        setData(res);
        writeCache(pageCacheKey, res);
      })
      .catch(() => {
        if (mounted) setError("Echec du chargement des produits");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [gender, debouncedBrand, page, size, sort, searchPool, searchPoolReady]);

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
  const fromPath = (() => {
    const path = gender === "HOMME" ? "/homme" : "/femme";
    const next = new URLSearchParams();
    if (brand.trim()) next.set("brand", brand.trim());
    if (sort !== "price,asc") next.set("sort", sort);
    if (page > 0) next.set("page", String(page + 1));
    const query = next.toString();
    return query ? `${path}?${query}` : path;
  })();

  return (
    <div className={pageClass}>
      <h1 ref={listTopRef}>Parfums {gender === "HOMME" ? "Homme" : "Femme"}</h1>
      <Filters
        brand={brand}
        setBrand={setBrand}
        sort={sort}
        setSort={setSort}
      />

      {loading && <p>Chargement...</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {data.content?.map((p) => (
          <ProductCard key={p.id} product={p} fromPath={fromPath} />
        ))}
      </div>

      <Pagination
        page={data.number || page}
        totalPages={data.totalPages || 0}
        onPageChange={setPage}
      />
    </div>
  );
};

export default Products;
