use axum::{
    extract::{Path, State},
    Json,
};

use crate::error::AppError;
use crate::features::auth::model::CurrentUser;
use crate::state::AppState;
use super::model::{UpdateUser, User, UserPublic};
use super::repository;

pub async fn get_user_by_username(
    State(state): State<AppState>,
    Path(username): Path<String>,
) -> Result<Json<UserPublic>, AppError> {
    let user = repository::find_by_username(&state.pool, &username)
        .await?
        .ok_or_else(|| AppError::NotFound("user not found".into()))?;

    Ok(Json(user.into()))
}

pub async fn get_me(
    State(state): State<AppState>,
    current_user: CurrentUser,
) -> Result<Json<User>, AppError> {
    let user = repository::find_by_id(&state.pool, current_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("user not found".into()))?;

    Ok(Json(user))
}

pub async fn update_me(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Json(payload): Json<UpdateUser>,
) -> Result<Json<UserPublic>, AppError> {
    if let Some(bio) = &payload.bio {
        if bio.len() > 280 {
            return Err(AppError::BadRequest("bio must be 280 chars or fewer".into()));
        }
    }

    let user = repository::update(&state.pool, current_user.id, payload).await?;
    Ok(Json(user.into()))
}
