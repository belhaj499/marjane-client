import { useEffect, useState } from "react";
import { getProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";

const Products = ({ gender }) => {
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("price,asc");
  const [size] = useState(12);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    getProducts({ gender, brand, page, size, sort })
      .then((res) => {
        if (mounted) setData(res);
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
  }, [gender, brand, page, size, sort]);

  useEffect(() => {
    setPage(0);
  }, [gender, brand, size, sort]);

  const pageClass =
    gender === "HOMME" ? "page page-homme" : "page page-femme";

  return (
    <div className={pageClass}>
      <h1>Parfums {gender === "HOMME" ? "Homme" : "Femme"}</h1>
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
          <ProductCard key={p.id} product={p} />
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
