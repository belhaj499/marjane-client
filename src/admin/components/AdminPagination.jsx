const AdminPagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="pagination">
      <button className="btn" onClick={() => onPageChange(Math.max(page - 1, 0))} disabled={page === 0}>
        Prec
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? "btn btn-primary" : "btn"}
          onClick={() => onPageChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button
        className="btn"
        onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
        disabled={page >= totalPages - 1}
      >
        Suiv
      </button>
    </div>
  );
};

export default AdminPagination;
