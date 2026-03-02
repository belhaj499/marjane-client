const AdminFilters = ({ gender, setGender, brand, setBrand, sort, setSort }) => {
  return (
    <div className="filters">
      <div className="field">
        <label>Genre</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Tous</option>
          <option value="HOMME">Homme</option>
          <option value="FEMME">Femme</option>
        </select>
      </div>
      <div className="field">
        <label>Marque</label>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Dior, Chanel..."
        />
      </div>
      <div className="field">
        <label>Trier</label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="price,asc">Prix: croissant</option>
          <option value="price,desc">Prix: decroissant</option>
        </select>
      </div>
    </div>
  );
};

export default AdminFilters;
