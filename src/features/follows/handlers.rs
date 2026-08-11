use axum::extract::{Path, State};
use serde_json::json;
use uuid::Uuid;

use crate::error::AppError;
use crate::features::auth::model::CurrentUser;
use crate::state::AppState;
use super::repository;

pub async fn follow_user(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Path(target_id): Path<Uuid>,
) -> Result<(), AppError> {
    if current_user.id == target_id {
        return Err(AppError::BadRequest("cannot follow yourself".into()));
    }

    // idempotent — calling this twice is a no-op, not an error
    repository::create(&state.pool, current_user.id, target_id).await?;
    Ok(())
}

pub async fn unfollow_user(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Path(target_id): Path<Uuid>,
) -> Result<(), AppError> {
    repository::delete(&state.pool, current_user.id, target_id).await?;
    Ok(())
}

pub async fn get_follow_counts(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<axum::Json<serde_json::Value>, AppError> {
    let followers = repository::followers_count(&state.pool, user_id).await?;
    let following = repository::following_count(&state.pool, user_id).await?;

    Ok(axum::Json(json!({
        "followers": followers,
        "following": following,
    })))
}
