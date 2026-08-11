use axum::{routing::post, Router};

use super::handlers::{like_tweet, unlike_tweet};
use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/{tweet_id}", post(like_tweet).delete(unlike_tweet))
}
