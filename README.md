# Twitter Clone — Axum API + React Native (Expo)

Full-stack Twitter-style clone: Rust/Axum backend and Expo React Native client.

## Structure

```
twitter-clone/
├── Cargo.toml
├── Dockerfile
├── .env.example
├── migrations/
├── src/                    # Axum API
├── mobile/                 # Expo React Native app
└── .github/workflows/      # Enterprise CI/CD
```

## Backend setup

1. **Postgres:**
   ```bash
   docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=twitter_clone -p 5432:5432 -d postgres:16
   ```

2. **Env:**
   ```bash
   cp .env.example .env
   # set a strong JWT_SECRET
   ```

3. **Run** (migrations apply on startup):
   ```bash
   cargo run
   ```

Server: `http://0.0.0.0:8080` (`BIND_ADDR`).

## Mobile setup

```bash
cd mobile
cp .env.example .env
npm install --legacy-peer-deps
npm start
```

| Environment | `EXPO_PUBLIC_API_URL` |
|---|---|
| iOS Simulator | `http://localhost:8080` |
| Android Emulator | `http://10.0.2.2:8080` |
| Physical device | `http://<LAN-IP>:8080` |

See [mobile/README.md](mobile/README.md).

## API surface

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register` | no |
| POST | `/api/auth/login` | no |
| POST | `/api/auth/refresh` | refresh body |
| POST | `/api/auth/logout` | yes |
| GET / PATCH | `/api/users/me` | yes |
| GET | `/api/users/{username}` | no |
| GET / POST | `/api/tweets` | yes |
| GET / DELETE | `/api/tweets/{id}` | GET no / DELETE yes |
| GET | `/api/tweets/by-user/{user_id}` | no |
| POST / DELETE | `/api/follows/{target_id}` | yes |
| GET | `/api/follows/counts/{user_id}` | no |
| POST / DELETE | `/api/likes/{tweet_id}` | yes |

Protected routes expect `Authorization: Bearer <access_token>`.

## Auth flow

1. Register/login → `{ access_token, refresh_token, user }`
2. Use access token (15m TTL) on protected routes
3. Refresh with `{ refresh_token, user_id }` (rotation)
4. Logout revokes all refresh tokens for the user

## CI / CD (enterprise)

| Workflow | Purpose |
|---|---|
| `backend-ci.yml` | rustfmt, clippy, Postgres integration tests, release build |
| `mobile-ci.yml` | Prettier, ESLint, TypeScript, expo-doctor |
| `security.yml` | Gitleaks, cargo-audit, npm audit, Trivy FS, SBOM |
| `codeql.yml` | CodeQL for Rust + JS/TS |
| `dependency-review.yml` | PR dependency / license gate |
| `container.yml` | Multi-stage Docker build → GHCR + image scan |
| `dependabot.yml` | Weekly Cargo / npm / Actions updates |

## Docker

```bash
docker build -t twitter-clone .
docker run --rm -p 8080:8080 \
  -e DATABASE_URL=postgres://... \
  -e JWT_SECRET=... \
  twitter-clone
```

## Notes

- Retweets / media / notifications are not wired yet.
- Timeline is pull-based (`JOIN` at read time).
- CORS is open for local dev — tighten before production.
- Keep `.sqlx/` committed so CI can build with `SQLX_OFFLINE=true`.
