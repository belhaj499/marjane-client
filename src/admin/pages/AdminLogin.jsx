import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { saveAdminCredentials } from "../auth/adminAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    const configuredApi = import.meta.env.VITE_API_URL;
    if (!configuredApi) {
      setError("API non configuree. Ajoutez VITE_API_URL dans Render.");
      return;
    }

    if (!username || !password) {
      setError("Entrez le nom d'utilisateur et le mot de passe");
      return;
    }

    setError("");
    try {
      // Validate against an admin-protected endpoint.
      await api.get("/api/orders", {
        params: { page: 0, size: 1 },
        auth: { username, password },
      });

      saveAdminCredentials(username, password);
      navigate("/admin/products", {
        state: { showAdminWelcome: true },
        replace: true,
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError("Identifiants invalides");
      } else {
        setError("Connexion serveur impossible. Verifiez VITE_API_URL et CORS backend.");
      }
    }
  };

  return (
    <div className="page login-page">
      <div className="login-card">
        <a className="login-back-link" href="/" aria-label="Retour accueil">
          <span aria-hidden="true">←</span>
        </a>
        <h1>Admin Login</h1>
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label>Username</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2a5 5 0 0 1 5 5 5 5 0 0 1-10 0 5 5 0 0 1 5-5zm0 12c4.42 0 8 2.02 8 4.5V22H4v-3.5C4 16.02 7.58 14 12 14z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="input-with-icon input-with-toggle">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 1a5 5 0 0 1 5 5v2h1a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h1V6a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3zm0 8a2 2 0 0 0-1 3.73V17h2v-2.27A2 2 0 0 0 12 11z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="card-actions">
            <button className="btn btn-primary" type="submit">Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
