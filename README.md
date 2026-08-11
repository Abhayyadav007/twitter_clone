# Twitter Clone — Axum Backend

## File tree

```
twitter-clone/
├── Cargo.toml
├── .env.example
├── migrations/
│   └── 0001_init.sql
└── src/
    ├── main.rs              # entrypoint: DB pool, migrations, CORS, tracing, server start
    ├── state.rs             # AppState (PgPool + jwt_secret) shared across handlers
    ├── error.rs              # AppError enum + IntoResponse impl (central error handling)
    ├── routes.rs             # aggregates every feature's routes under /api
    └── features/
        ├── mod.rs
        ├── auth/
        │   ├── mod.rs
        │   ├── model.rs      # Claims, CurrentUser extractor, AuthResponse, LoginRequest
        │   ├── jwt.rs        # create/verify access + refresh tokens
        │   ├── password.rs   # argon2 hash/verify
        │   ├── middleware.rs # optional group-level auth middleware (alt to extractor)
        │   ├── handlers.rs   # register, login, refresh, logout
        │   └── routes.rs
        ├── users/
        │   ├── mod.rs
        │   ├── model.rs      # User, CreateUser, UpdateUser, UserPublic
        │   ├── repository.rs
        │   ├── handlers.rs   # get_me, update_me, get_user_by_username
        │   └── routes.rs
        ├── tweets/
        │   ├── mod.rs
        │   ├── model.rs      # Tweet, CreateTweet, TweetWithAuthor, Pagination
        │   ├── repository.rs # includes the timeline feed JOIN query
        │   ├── handlers.rs   # create/get/delete tweet, user tweets, timeline
        │   └── routes.rs
        ├── follows/
        │   ├── mod.rs, model.rs, repository.rs, handlers.rs, routes.rs
        └── likes/
            ├── mod.rs, model.rs, repository.rs, handlers.rs, routes.rs
```

## Setup

1. **Postgres running locally** (or via Docker):
   ```bash
   docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=twitter_clone -p 5432:5432 -d postgres:16
   ```

2. **Copy env file:**
   ```bash
   cp .env.example .env
   # edit JWT_SECRET to a real random string
   ```

3. **Install sqlx-cli (optional, only needed if you edit queries and want compile-time checks):**
   ```bash
   cargo install sqlx-cli --no-default-features --features postgres
   ```

4. **Run** — migrations run automatically on startup via `sqlx::migrate!` in `main.rs`:
   ```bash
   cargo run
   ```

Server listens on `0.0.0.0:8080` by default (`BIND_ADDR` in `.env`).

## API surface

| Method | Path | Auth required |
|---|---|---|
| POST | `/api/auth/register` | no |
| POST | `/api/auth/login` | no |
| POST | `/api/auth/refresh` | no (needs valid refresh token) |
| POST | `/api/auth/logout` | yes |
| GET  | `/api/users/me` | yes |
| PATCH| `/api/users/me` | yes |
| GET  | `/api/users/{username}` | no |
| GET  | `/api/tweets` | yes (this is the home timeline) |
| POST | `/api/tweets` | yes |
| GET  | `/api/tweets/{id}` | no |
| DELETE | `/api/tweets/{id}` | yes (must be owner) |
| GET  | `/api/tweets/by-user/{user_id}` | no |
| POST | `/api/follows/{target_id}` | yes |
| DELETE | `/api/follows/{target_id}` | yes |
| GET  | `/api/follows/counts/{user_id}` | no |
| POST | `/api/likes/{tweet_id}` | yes |
| DELETE | `/api/likes/{tweet_id}` | yes |

All routes marked "yes" expect `Authorization: Bearer <access_token>`.

## Auth flow

1. `POST /api/auth/register` or `/login` → returns `{ access_token, refresh_token, user }`.
2. Send `access_token` as `Authorization: Bearer <token>` on protected routes (15 min TTL).
3. When it expires, `POST /api/auth/refresh` with `{ refresh_token, user_id }` → returns a fresh pair. The old refresh token is deleted (rotation) so it can't be reused.
4. `POST /api/auth/logout` revokes all refresh tokens for that user.

## Notes / things to extend next

- **Retweets, media uploads, notifications, hashtags/mentions** aren't wired up yet — they follow the exact same `model.rs` / `repository.rs` / `handlers.rs` / `routes.rs` pattern as `likes` and `follows`.
- **Timeline is pull-based** (computed at read time via JOIN in `tweets/repository.rs::get_feed`). Fine until you have heavy fan-out; switch to a precomputed feed table if a single user follows tens of thousands of accounts.
- **`sqlx::query_as!` / `query!` macros** normally check queries against a live DB at compile time. If you don't want that, add a `.sqlx` offline cache with `cargo sqlx prepare`, or switch to the non-macro `sqlx::query_as::<_, T>(...)` runtime API.
- **CORS is wide open** (`Any`) for local dev — restrict `allow_origin` before deploying.
