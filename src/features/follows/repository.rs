use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

pub async fn exists(pool: &PgPool, follower_id: Uuid, following_id: Uuid) -> Result<bool, AppError> {
    let row = sqlx::query!(
        r#"SELECT EXISTS(
             SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2
           ) AS "exists!""#,
        follower_id,
        following_id,
    )
    .fetch_one(pool)
    .await?;

    Ok(row.exists)
}

pub async fn create(pool: &PgPool, follower_id: Uuid, following_id: Uuid) -> Result<(), AppError> {
    sqlx::query!(
        r#"INSERT INTO follows (follower_id, following_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING"#,
        follower_id,
        following_id,
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn delete(pool: &PgPool, follower_id: Uuid, following_id: Uuid) -> Result<(), AppError> {
    sqlx::query!(
        "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
        follower_id,
        following_id,
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn followers_count(pool: &PgPool, user_id: Uuid) -> Result<i64, AppError> {
    let row = sqlx::query!(
        r#"SELECT COUNT(*) AS "count!" FROM follows WHERE following_id = $1"#,
        user_id
    )
    .fetch_one(pool)
    .await?;
    Ok(row.count)
}

pub async fn following_count(pool: &PgPool, user_id: Uuid) -> Result<i64, AppError> {
    let row = sqlx::query!(
        r#"SELECT COUNT(*) AS "count!" FROM follows WHERE follower_id = $1"#,
        user_id
    )
    .fetch_one(pool)
    .await?;
    Ok(row.count)
}
