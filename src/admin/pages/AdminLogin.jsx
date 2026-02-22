import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { saveAdminCredentials } from "../auth/adminAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Entrez le nom d'utilisateur et le mot de passe");
      return;
    }
    setError("");
    try {
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      await axios.get(`${baseURL}/api/products`, {
        params: { page: 0, size: 1 },
        auth: { username, password },
      });
      saveAdminCredentials(username, password);
      navigate("/admin/products");
    } catch {
      setError("Identifiants invalides");
    }
  };

  return (
    <div className="page login-page">
      <div className="login-card">
        <h1>Admin Login</h1>
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="card-actions">
            <button className="btn btn-primary" type="submit">Login</button>
            <a className="btn" href="/">Retour accueil</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
