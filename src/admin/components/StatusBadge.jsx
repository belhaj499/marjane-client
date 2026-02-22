const StatusBadge = ({ status }) => {
  const value = (status || "").toUpperCase();
  const className = `badge ${
    value === "PENDING" ? "badge-unavailable" :
    value === "CONFIRMED" ? "badge-available" :
    value === "SHIPPED" ? "badge-available" :
    value === "DELIVERED" ? "badge-available" :
    value === "CANCELED" ? "badge-unavailable" :
    "badge"
  }`;

  return <span className={className}>{value}</span>;
};

export default StatusBadge;
