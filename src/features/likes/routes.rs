use axum::{routing::post, Router};

use crate::state::AppState;
use super::handlers::{like_tweet, unlike_tweet};

pub fn routes() -> Router<AppState> {
    Router::new().route("/{tweet_id}", post(like_tweet).delete(unlike_tweet))
}
