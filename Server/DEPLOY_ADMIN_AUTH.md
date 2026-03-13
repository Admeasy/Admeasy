# Admin Panel Auth – Production Checklist

## What was fixed

- **Dual auth**: Backend accepts admin JWT from **cookie** (`adminToken`) **or** `Authorization: Bearer <token>`.
- **Frontend**: On login, the token is stored in `sessionStorage` and sent as `Authorization: Bearer <token>` on every admin API request. Cookies are still sent for compatibility.

## Environment variables (production)

Ensure these are set on the server:

- `JWT_ADMIN_SECRET` – used to sign and verify admin JWTs (must match across restarts).
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` – admin login credentials.
- `NODE_ENV=production` – so cookies use `secure: true`.

## Nginx (if you use it as reverse proxy)

So that the backend receives the token and cookies from the client:

```nginx
location /api/ {
    proxy_pass http://localhost:5000;   # or your Node upstream
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
    proxy_pass_request_headers on;
    proxy_set_header Cookie $http_cookie;
}
```

Important:

- `proxy_set_header Authorization $http_authorization;` – forwards the `Authorization` header (Bearer token).
- `proxy_pass_request_headers on;` and `proxy_set_header Cookie $http_cookie;` – forward cookies (e.g. `adminToken`).

## CORS

The app already uses:

- `credentials: true`
- Allowed origins: `https://admeasy.in`, `https://www.admeasy.in`, `http://localhost:5173`

No extra CORS change is required for sending `Authorization` from these origins.

## If 401 persists in production

1. Confirm `JWT_ADMIN_SECRET` is set and unchanged (no restart with a different value after login).
2. In Network tab, check the failing request: does it have `Authorization: Bearer <token>`?
3. After admin login, confirm the login response has a `token` field and that the admin panel stores it (e.g. in sessionStorage) and sends it on the next request.
4. On the server, check logs for `[AdminAuth]` messages (e.g. “401: No token” or “Token error”).
