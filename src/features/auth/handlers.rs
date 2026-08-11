use axum::{extract::State, Json};

use crate::error::AppError;
use crate::features::users::model::CreateUser;
use crate::features::users::repository as user_repo;
use crate::state::AppState;

use super::jwt;
use super::model::{AuthResponse, LoginRequest, RefreshRequest};
use super::password::{hash_password, verify_password};

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<Json<AuthResponse>, AppError> {
    if payload.username.trim().len() < 3 {
        return Err(AppError::BadRequest(
            "username must be at least 3 chars".into(),
        ));
    }
    if payload.password.len() < 8 {
        return Err(AppError::BadRequest(
            "password must be at least 8 chars".into(),
        ));
    }

    if user_repo::find_by_email(&state.pool, &payload.email)
        .await?
        .is_some()
    {
        return Err(AppError::Conflict("email already registered".into()));
    }
    if user_repo::find_by_username(&state.pool, &payload.username)
        .await?
        .is_some()
    {
        return Err(AppError::Conflict("username already taken".into()));
    }

    let user = user_repo::create(&state.pool, payload).await?;
    issue_tokens(&state, user).await
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let user = user_repo::find_by_email(&state.pool, &payload.email)
        .await?
        .ok_or_else(|| AppError::Unauthorized("invalid credentials".into()))?;

    let valid = verify_password(&payload.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::Unauthorized("invalid credentials".into()));
    }

    issue_tokens(&state, user).await
}

pub async fn refresh(
    State(state): State<AppState>,
    Json(payload): Json<RefreshRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let rows = sqlx::query!(
        r#"SELECT id, token_hash, expires_at FROM refresh_tokens
           WHERE user_id = $1 AND expires_at > now()"#,
        payload.user_id
    )
    .fetch_all(&state.pool)
    .await?;

    // check the presented token against stored hashes for this user
    let matched = rows
        .iter()
        .find(|row| verify_password(&payload.refresh_token, &row.token_hash).unwrap_or(false));

    let Some(matched) = matched else {
        return Err(AppError::Unauthorized(
            "invalid or expired refresh token".into(),
        ));
    };

    // rotate: delete the used refresh token so it can't be replayed
    sqlx::query!("DELETE FROM refresh_tokens WHERE id = $1", matched.id)
        .execute(&state.pool)
        .await?;

    let user = user_repo::find_by_id(&state.pool, payload.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("user not found".into()))?;

    issue_tokens(&state, user).await
}

pub async fn logout(
    State(state): State<AppState>,
    current_user: super::model::CurrentUser,
) -> Result<(), AppError> {
    // revoke all refresh tokens for this user
    sqlx::query!(
        "DELETE FROM refresh_tokens WHERE user_id = $1",
        current_user.id
    )
    .execute(&state.pool)
    .await?;
    Ok(())
}

/// Shared by register/login/refresh — mints a fresh access+refresh pair
/// and persists the refresh token's hash.
async fn issue_tokens(
    state: &AppState,
    user: crate::features::users::model::User,
) -> Result<Json<AuthResponse>, AppError> {
    let access_token = jwt::create_access_token(user.id, &user.username, &state.jwt_secret)?;
    let refresh_token = jwt::create_refresh_token();
    let refresh_hash = hash_password(&refresh_token)?;

    sqlx::query!(
        r#"INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
           VALUES ($1, $2, $3, now() + interval '30 days')"#,
        Uuid::new_v4(),
        user.id,
        refresh_hash,
    )
    .execute(&state.pool)
    .await?;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: user.into(),
    }))
}
