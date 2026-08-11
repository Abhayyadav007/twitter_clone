use axum::{
    body::Body,
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};

use crate::state::AppState;
use super::jwt;
use super::model::CurrentUser;

/// Applied with `.layer(middleware::from_fn_with_state(state, auth_middleware))`
/// on an entire Router group (e.g. all of `/api/*` except `/api/auth/*`).
///
/// This checks the token and inserts `CurrentUser` into request extensions,
/// so downstream handlers can pull it out with `Extension(current_user): Extension<CurrentUser>`.
///
/// Use this OR the `CurrentUser` extractor per-handler — not both. The extractor
/// is simpler for mixed public/private routes in the same router; this middleware
/// is cleaner when an entire nested router is private (e.g. everything under `/api`).
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = jwt::verify_token(token, &state.jwt_secret)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(CurrentUser {
        id: claims.sub,
        username: claims.username,
    });

    Ok(next.run(req).await)
}
