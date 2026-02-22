const KEY = "admin_credentials";

export const saveAdminCredentials = (username, password) => {
  const payload = { username, password };
  localStorage.setItem(KEY, JSON.stringify(payload));
};

export const getAdminCredentials = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAdminCredentials = () => {
  localStorage.removeItem(KEY);
};

export const isAdminLoggedIn = () => {
  const creds = getAdminCredentials();
  return Boolean(creds?.username && creds?.password);
};
