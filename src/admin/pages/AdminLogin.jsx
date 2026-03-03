import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { saveAdminCredentials } from "../auth/adminAuth";
import { writeCache } from "../../utils/productsWarmup";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Warm admin chunks while user is on login screen.
    import("../components/AdminLayout").catch(() => {});
    import("./AdminProducts").catch(() => {});
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

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
    setSubmitting(true);
    try {
      // Fast auth check, then navigate immediately.
      await api.get("/api/products", {
        params: { page: 0, size: 1 },
        auth: { username, password },
      });

      saveAdminCredentials(username, password);
      navigate("/admin/products", {
        state: { showAdminWelcome: true },
        replace: true,
      });

      // Warm first admin page in background (no blocking).
      api
        .get("/api/products", {
          params: { page: 0, size: 10, sort: "price,asc" },
          auth: { username, password },
        })
        .then((res) => {
          const adminFirstPageKey = "admin-products|v0|||price,asc|0|10";
          writeCache(adminFirstPageKey, {
            ...res.data,
            content: res?.data?.content || [],
          });
        })
        .catch(() => {});
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError("Identifiants invalides");
      } else {
        setError("Connexion serveur impossible. Verifiez VITE_API_URL et CORS backend.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page login-page">
      <div className="login-card">
        <a className="login-back-link" href="/" aria-label="Retour accueil">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 0 1-1.41 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0z"
                fill="currentColor"
              />
            </svg>
          </span>
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
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Connexion..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
