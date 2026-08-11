use axum::extract::{Path, State};
use uuid::Uuid;

use crate::error::AppError;
use crate::features::auth::model::CurrentUser;
use crate::state::AppState;
use super::repository;

pub async fn like_tweet(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Path(tweet_id): Path<Uuid>,
) -> Result<(), AppError> {
    repository::create(&state.pool, current_user.id, tweet_id).await?;
    Ok(())
}

pub async fn unlike_tweet(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Path(tweet_id): Path<Uuid>,
) -> Result<(), AppError> {
    repository::delete(&state.pool, current_user.id, tweet_id).await?;
    Ok(())
}
