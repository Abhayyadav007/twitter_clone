use axum::{routing::get, Router};

use super::handlers::{get_me, get_user_by_username, update_me};
use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/me", get(get_me).patch(update_me))
        .route("/{username}", get(get_user_by_username))
}
