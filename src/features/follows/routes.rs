use axum::{
    routing::{get, post},
    Router,
};

use super::handlers::{follow_user, get_follow_counts, unfollow_user};
use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/{target_id}", post(follow_user).delete(unfollow_user))
        .route("/counts/{user_id}", get(get_follow_counts))
}
