use axum::extract::{Path, State};
use uuid::Uuid;

use super::repository;
use crate::error::AppError;
use crate::features::auth::model::CurrentUser;
use crate::features::tweets::repository as tweet_repository;
use crate::state::AppState;

pub async fn like_tweet(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Path(tweet_id): Path<Uuid>,
) -> Result<(), AppError> {
    tweet_repository::find_by_id(&state.pool, tweet_id)
        .await?
        .ok_or_else(|| AppError::NotFound("tweet not found".into()))?;

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
