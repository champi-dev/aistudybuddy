# AI Study Buddy — Production Deployment Report

Public URL: https://aistudybuddy.champi.lat -> 127.0.0.1:8087 (web container)

## Files created (repo root of app)
- `Dockerfile.server` — backend prod image (node:20-alpine, `npm ci --omit=dev`, runs migrations then server via `npm start`). Patches at build time the hard-coded `NODE_ENV===production => Postgres SSL` in `src/config/database.js` and `knexfile.js` so SSL is opt-in via `PGSSL=true` (the shared postgres container has no SSL).
- `Dockerfile.web` — frontend built with Vite (`VITE_API_URL=/api`, same-origin) and served by nginx:1.27-alpine.
- `nginx.conf` — SPA fallback; proxies `/api/` and `/health` to `aistudybuddy-server:5000` (variable upstream + Docker DNS 127.0.0.11 so nginx starts even if backend is down).
- `deploy.report.md` — this file.

Existing `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` were not modified.

## Internal ports
- `aistudybuddy-server`: 5000 (Express, `/api/*`, `/health`)
- `aistudybuddy-web`: 80 (nginx) — publish as `127.0.0.1:8087:80`

## Database init / migrations
Migrations run automatically on container start (`npm start` = `knex migrate:latest && node src/server.js`).
Manual command if needed:

```bash
sg docker -c "docker compose exec aistudybuddy-server npx knex migrate:latest"
```

Create the database once on the shared postgres (if it does not exist):

```bash
sg docker -c "docker compose exec postgres psql -U champi -c 'CREATE DATABASE aistudybuddy'"
```

## Environment variables (backend)
| Var | Value | Notes |
|---|---|---|
| NODE_ENV | `production` | required |
| PORT | `5000` | server listen port |
| DATABASE_URL | `postgresql://champi:champi2026@postgres:5432/aistudybuddy` | required |
| PGSSL | `false` | keep false for the plain postgres container (custom flag added by Dockerfile.server) |
| REDIS_URL | `redis://redis:6379` | cache + Bull queue (AI card generation) |
| JWT_SECRET | `${AISTUDYBUDDY_JWT_SECRET}` | >=32 chars, required |
| OPENAI_API_KEY | `${OPENAI_API_KEY}` | required (AI features use OpenAI) |
| FRONTEND_URL | `https://aistudybuddy.champi.lat` | CORS allowlist in production |
| OPENAI_MODEL | `gpt-4o-mini` | optional (default `gpt-3.5-turbo`) |
| OPENAI_MAX_TOKENS_PER_REQUEST | `1000` | optional |
| OPENAI_TEMPERATURE | `0.7` | optional |
| JWT_EXPIRE, BCRYPT_ROUNDS, DAILY_TOKEN_LIMIT, MAX_TOKENS_PER_REQUEST | — | optional, have defaults |

Frontend: `VITE_API_URL=/api` is baked into the image at build time (same-origin); no runtime env needed.

## Compose snippet (shared postgres/redis already on the network)
```yaml
  aistudybuddy-server:
    build:
      context: ./aistudybuddy
      dockerfile: Dockerfile.server
    container_name: aistudybuddy-server
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: "5000"
      DATABASE_URL: postgresql://champi:champi2026@postgres:5432/aistudybuddy
      PGSSL: "false"
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${AISTUDYBUDDY_JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENAI_MODEL: gpt-4o-mini
      FRONTEND_URL: https://aistudybuddy.champi.lat
    depends_on:
      - postgres
      - redis

  aistudybuddy-web:
    build:
      context: ./aistudybuddy
      dockerfile: Dockerfile.web
    container_name: aistudybuddy-web
    restart: unless-stopped
    ports:
      - "127.0.0.1:8087:80"
    depends_on:
      - aistudybuddy-server
```

## Smoke test
`aistudybuddy-web:prod` run on `127.0.0.1:9087` -> `GET /` returned HTTP 200 with the SPA index.html. Container removed after the test.

## Caveats
- The `aistudybuddy` database must exist before first server start (migrations create tables, not the DB).
- Bull queue (`src/config/queue.js`) requires Redis at startup; keep `REDIS_URL` set.
- `npm start` re-runs migrations on every restart (idempotent via knex_migrations table).
- CORS: same-origin via nginx proxy, and `FRONTEND_URL` covers the public origin.
