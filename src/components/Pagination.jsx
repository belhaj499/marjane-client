const Pagination = ({ page, totalPages, onPageChange, loading = false }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="pagination">
      <button
        className="btn"
        onClick={() => onPageChange(Math.max(page - 1, 0))}
        disabled={loading || page === 0}
      >
        Prec
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? "btn btn-primary" : "btn"}
          onClick={() => onPageChange(p)}
          disabled={loading}
        >
          {p + 1}
        </button>
      ))}
      <button
        className="btn"
        onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
        disabled={loading || page >= totalPages - 1}
      >
        Suiv
      </button>
    </div>
  );
};

export default Pagination;
