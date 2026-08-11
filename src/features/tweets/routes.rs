use axum::{routing::get, Router};

use super::handlers::{create_tweet, delete_tweet, get_timeline, get_tweet, get_user_tweets};
use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_timeline).post(create_tweet))
        .route("/{id}", get(get_tweet).delete(delete_tweet))
        .route("/by-user/{user_id}", get(get_user_tweets))
}
