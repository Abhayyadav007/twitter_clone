use sqlx::PgPool;
use uuid::Uuid;

use super::model::{CreateUser, UpdateUser, User};
use crate::error::AppError;
use crate::features::auth::password::hash_password;

pub async fn create(pool: &PgPool, payload: CreateUser) -> Result<User, AppError> {
    let password_hash = hash_password(&payload.password)?;
    let id = Uuid::new_v4();

    let user = sqlx::query_as!(
        User,
        r#"INSERT INTO users (id, username, email, password_hash)
           VALUES ($1, $2, $3, $4)
           RETURNING *"#,
        id,
        payload.username,
        payload.email,
        password_hash,
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, AppError> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(pool)
        .await?;
    Ok(user)
}

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, AppError> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE email = $1", email)
        .fetch_optional(pool)
        .await?;
    Ok(user)
}

pub async fn find_by_username(pool: &PgPool, username: &str) -> Result<Option<User>, AppError> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE username = $1", username)
        .fetch_optional(pool)
        .await?;
    Ok(user)
}

pub async fn update(pool: &PgPool, id: Uuid, payload: UpdateUser) -> Result<User, AppError> {
    let user = sqlx::query_as!(
        User,
        r#"UPDATE users SET
             display_name = COALESCE($2, display_name),
             bio           = COALESCE($3, bio),
             avatar_url    = COALESCE($4, avatar_url),
             banner_url    = COALESCE($5, banner_url),
             updated_at    = now()
           WHERE id = $1
           RETURNING *"#,
        id,
        payload.display_name,
        payload.bio,
        payload.avatar_url,
        payload.banner_url,
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}
