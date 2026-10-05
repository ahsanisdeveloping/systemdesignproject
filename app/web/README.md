# Next.js frontend

Start Express from `app/api` with `npm run dev`. From this directory:

```sh
npm install
cp .env.example .env.local
npm run dev
```

In PowerShell, use `Copy-Item .env.example .env.local`. Use `npm.cmd` if
PowerShell blocks `npm.ps1`.

Open http://localhost:3000 and click **Check API health**. No request runs on
page load. The browser logs the result, validates its shape, disables caching,
applies a ten-second timeout, and cancels requests on unmount. The button has
loading, failure, and retry states.

## Routing

The browser always requests the relative URL `/api/v1/health`.

- Without Nginx, `next dev` rewrites `/api/v1/*` to Express. `API_BASE_URL`
  configures the development backend origin and defaults to
  `http://localhost:5000`. Restart Next.js after changing it.
- With Nginx, open http://localhost:8080. Nginx sends `/api/v1/*` directly to
  Express and page requests to Next.js. API calls bypass Next.js.
- `next build` / `next start` do not enable the development rewrite. Use Nginx
  for API routing when running the production build.

There is no Next.js health Route Handler. Express owns the response. Both
setups use one browser origin, so this flow needs no CORS configuration.
The local Nginx config has five-second connection/read timeouts; proxy errors
can return HTML, which the browser handles by checking status before parsing.

This checks Express process liveness through the chosen routing path. It does
not check database readiness or other dependencies. Use
`http://localhost:5000/api/v1/health` to check Express independently.

See the [root README](../../README.md) for running Nginx.

## Checks

```sh
curl http://localhost:3000/api/v1/health
npm run lint
npm run build
npm start
```

After `npm start`, check health through port 8080, not port 3000.
