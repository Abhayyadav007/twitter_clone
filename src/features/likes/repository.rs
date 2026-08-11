use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

pub async fn exists(pool: &PgPool, user_id: Uuid, tweet_id: Uuid) -> Result<bool, AppError> {
    let row = sqlx::query!(
        r#"SELECT EXISTS(
             SELECT 1 FROM likes WHERE user_id = $1 AND tweet_id = $2
           ) AS "exists!""#,
        user_id,
        tweet_id,
    )
    .fetch_one(pool)
    .await?;

    Ok(row.exists)
}

pub async fn create(pool: &PgPool, user_id: Uuid, tweet_id: Uuid) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;

    let result = sqlx::query!(
        r#"INSERT INTO likes (user_id, tweet_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING"#,
        user_id,
        tweet_id,
    )
    .execute(&mut *tx)
    .await?;

    // only bump the counter if a row was actually inserted (avoids double-counting on retry)
    if result.rows_affected() > 0 {
        sqlx::query!(
            "UPDATE tweets SET like_count = like_count + 1 WHERE id = $1",
            tweet_id
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}

pub async fn delete(pool: &PgPool, user_id: Uuid, tweet_id: Uuid) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;

    let result = sqlx::query!(
        "DELETE FROM likes WHERE user_id = $1 AND tweet_id = $2",
        user_id,
        tweet_id,
    )
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() > 0 {
        sqlx::query!(
            "UPDATE tweets SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1",
            tweet_id
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}
