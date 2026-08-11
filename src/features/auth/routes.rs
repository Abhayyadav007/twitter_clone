use axum::{routing::post, Router};

use super::handlers::{login, logout, refresh, register};
use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/refresh", post(refresh))
        .route("/logout", post(logout)) // uses CurrentUser extractor internally, so still requires a valid token
}
