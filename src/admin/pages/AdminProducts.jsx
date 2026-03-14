import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminProducts, deleteAdminProduct } from "../api/adminProducts";
import AdminPagination from "../components/AdminPagination";
import AdminFilters from "../components/AdminFilters";
import { buildImageUrl } from "../../api/axios";
import {
  ADMIN_CACHE_TTL_MS,
  invalidateProductCaches,
  readCacheWithTtl,
  writeCache,
} from "../../utils/productsWarmup";

const SEARCH_POOL_PAGE_SIZE = 120;

const AdminProducts = () => {
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("price,asc");
  const [size] = useState(10);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchPool, setSearchPool] = useState([]);
  const [searchPoolReady, setSearchPoolReady] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);

  const prevFiltersRef = useRef({
    gender,
    debouncedSearch,
    sort,
    size,
  });

  const filterBySearch = (items, query) => {
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

  const pageCacheKey = (targetPage) =>
    `admin-products|v${cacheVersion}|${gender}|${sort}|${targetPage}|${size}`;

  const poolCacheKey = `admin-products-pool|v${cacheVersion}|${gender}|${sort}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 100);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSearchPool([]);
    setSearchPoolReady(false);

    let mounted = true;
    const cached = readCacheWithTtl(poolCacheKey, ADMIN_CACHE_TTL_MS);
    if (cached) {
      setSearchPool(Array.isArray(cached) ? cached : []);
      setSearchPoolReady(true);
      return () => {
        mounted = false;
      };
    }

    const warmPool = async () => {
      try {
        const first = await getAdminProducts({
          page: 0,
          size: SEARCH_POOL_PAGE_SIZE,
          gender,
          brand: "",
          sort,
        });

        if (!mounted) return;

        let items = [...(first?.content || [])];
        const totalPages = Number(first?.totalPages || 1);

        for (let p = 1; p < totalPages; p += 1) {
          const res = await getAdminProducts({
            page: p,
            size: SEARCH_POOL_PAGE_SIZE,
            gender,
            brand: "",
            sort,
          });
          if (!mounted) return;
          items = items.concat(res?.content || []);
        }

        const uniqueItems = uniqueById(items);
        writeCache(poolCacheKey, uniqueItems);
        setSearchPool(uniqueItems);
        setSearchPoolReady(true);
      } catch {
        if (!mounted) return;
        setSearchPool([]);
        setSearchPoolReady(false);
      }
    };

    warmPool();

    return () => {
      mounted = false;
    };
  }, [poolCacheKey, gender, sort, cacheVersion]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setError("");

    const hasSearch = debouncedSearch.trim().length > 0;

    if (searchPoolReady) {
      // Once pool is ready, paginate locally for instant page switches.
      const source = hasSearch ? filterBySearch(searchPool, debouncedSearch) : searchPool;
      const uniqueItems = uniqueById(source);
      const totalPages = Math.ceil(uniqueItems.length / size);
      const safePage = Math.min(page, Math.max(totalPages - 1, 0));
      const start = safePage * size;
      const content = uniqueItems.slice(start, start + size);
      setData({
        content,
        number: safePage,
        totalPages,
      });
      if (safePage !== page) setPage(safePage);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (hasSearch) {
      // Avoid showing false "no results" while the full searchable pool is still loading.
      setLoading(true);
      return () => {
        mounted = false;
      };
    }

    const key = pageCacheKey(page);
    const cached = readCacheWithTtl(key, ADMIN_CACHE_TTL_MS);
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

    getAdminProducts({
      page,
      size,
      gender,
      brand: "",
      sort,
      signal: controller.signal,
    })
      .then((res) => {
        if (!mounted) return;
        const next = {
          ...res,
          content: uniqueById(res?.content || []),
        };
        setData(next);
        writeCache(key, next);
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
          return;
        }
        if (mounted) setError("Echec du chargement");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [gender, debouncedSearch, page, size, sort, searchPool, searchPoolReady, cacheVersion]);

  useEffect(() => {
    if (debouncedSearch.trim()) return;
    if (searchPoolReady) return;
    const totalPages = Number(data?.totalPages || 0);
    if (totalPages <= 1) return;

    const toWarm = [];
    if (page + 1 < totalPages) toWarm.push(page + 1);
    if (page - 1 >= 0) toWarm.push(page - 1);

    toWarm.forEach((targetPage) => {
      const key = pageCacheKey(targetPage);
      if (readCacheWithTtl(key, ADMIN_CACHE_TTL_MS)) return;
      getAdminProducts({
        page: targetPage,
        size,
        gender,
        brand: "",
        sort,
      })
        .then((res) => {
          const next = {
            ...res,
            content: uniqueById(res?.content || []),
          };
          writeCache(key, next);
        })
        .catch(() => {});
    });
  }, [debouncedSearch, searchPoolReady, data?.totalPages, page, size, gender, sort, cacheVersion]);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const changed =
      prev.gender !== gender ||
      prev.debouncedSearch !== debouncedSearch ||
      prev.sort !== sort ||
      prev.size !== size;

    if (changed) {
      setPage(0);
    }

    prevFiltersRef.current = {
      gender,
      debouncedSearch,
      sort,
      size,
    };
  }, [gender, debouncedSearch, sort, size]);

  const onDelete = async (id) => {
    if (deletingId !== null) return;
    if (!confirm("Supprimer ce produit ?")) return;
    setMessage("");
    setError("");
    setDeletingId(id);
    try {
      await deleteAdminProduct(id);
      invalidateProductCaches();
      setMessage("Produit supprime");
      setCacheVersion((v) => v + 1);
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Suppression refusee par le serveur (produit lie a des commandes).";
      setError(backendMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const hasSearch = debouncedSearch.trim().length > 0;
  const effectiveData = data;
  const showSearchLoading = hasSearch && !searchPoolReady;

  return (
    <div className="page">
      <div className="card">
        <div className="card-body">
          <h1>Produits</h1>
          <Link className="btn btn-primary" to="/admin/products/new">Nouveau produit</Link>
        </div>
      </div>

      <AdminFilters
        gender={gender}
        setGender={setGender}
        brand={search}
        setBrand={setSearch}
        sort={sort}
        setSort={setSort}
      />

      {(loading || showSearchLoading) && <p>Chargement...</p>}
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      <div className="card">
        <div className="card-body">
          <div className="admin-table-wrap">
            <table className="admin-products-table" width="100%">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Nom</th>
                  <th>Marque</th>
                  <th>Genre</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Actif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!showSearchLoading &&
                  effectiveData.content?.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>
                      {p.imageUrl ? (
                        <img src={buildImageUrl(p.imageUrl)} alt={p.name} width="40" height="40" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{p.name}</td>
                    <td>{p.brand}</td>
                    <td>{p.gender}</td>
                    <td>{Number(p.price).toFixed(2)} DH</td>
                    <td>{p.stock}</td>
                    <td>{p.active ? "Oui" : "Non"}</td>
                    <td>
                      <Link
                        className="btn"
                        to={`/admin/products/${p.id}/edit`}
                        aria-disabled={deletingId === p.id}
                        style={deletingId === p.id ? { pointerEvents: "none", opacity: 0.6 } : undefined}
                      >
                        Editer
                      </Link>{" "}
                      <button
                        className="btn"
                        onClick={() => onDelete(p.id)}
                        disabled={deletingId !== null}
                      >
                        {deletingId === p.id ? "Suppression..." : "Supprimer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminPagination
        page={effectiveData.number || page}
        totalPages={showSearchLoading ? 0 : effectiveData.totalPages || 0}
        onPageChange={setPage}
        loading={loading || showSearchLoading}
      />
    </div>
  );
};

export default AdminProducts;
