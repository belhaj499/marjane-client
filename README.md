# Marjane Client (Vite + React)

## Environment Variables

Create a `.env` file in the project root for local development:

```env
VITE_API_URL=http://localhost:8080
```

All frontend API calls use the shared axios instance from `src/api.js`:

- `baseURL = import.meta.env.VITE_API_URL`
- endpoints are called as `/api/...`

## Production (Render Static Site)

In your Render Static Site settings, add this environment variable:

```env
VITE_API_URL=https://marjane-nthi.onrender.com
```

Then redeploy the frontend.
