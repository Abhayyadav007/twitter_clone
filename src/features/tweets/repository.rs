use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use super::model::{CreateTweet, Tweet, TweetWithAuthor};
use crate::error::AppError;

pub async fn create(pool: &PgPool, user_id: Uuid, payload: CreateTweet) -> Result<Tweet, AppError> {
    let mut tx = pool.begin().await?;
    let id = Uuid::new_v4();

    let tweet = sqlx::query_as!(
        Tweet,
        r#"INSERT INTO tweets (id, user_id, content, reply_to_id, quote_tweet_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *"#,
        id,
        user_id,
        payload.content,
        payload.reply_to_id,
        payload.quote_tweet_id,
    )
    .fetch_one(&mut *tx)
    .await?;

    // keep the parent's reply_count in sync
    if let Some(parent_id) = payload.reply_to_id {
        sqlx::query!(
            "UPDATE tweets SET reply_count = reply_count + 1 WHERE id = $1",
            parent_id
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(tweet)
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Tweet>, AppError> {
    let tweet = sqlx::query_as!(Tweet, "SELECT * FROM tweets WHERE id = $1", id)
        .fetch_optional(pool)
        .await?;
    Ok(tweet)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query!("DELETE FROM tweets WHERE id = $1", id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn find_by_user(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
    before: Option<DateTime<Utc>>,
) -> Result<Vec<Tweet>, AppError> {
    let tweets = sqlx::query_as!(
        Tweet,
        r#"SELECT * FROM tweets
           WHERE user_id = $1 AND ($2::timestamptz IS NULL OR created_at < $2)
           ORDER BY created_at DESC
           LIMIT $3"#,
        user_id,
        before,
        limit,
    )
    .fetch_all(pool)
    .await?;

    Ok(tweets)
}

/// The home timeline: tweets from everyone `viewer_id` follows (plus their own),
/// newest first, cursor-paginated on `created_at`, joined with author info and
/// like/retweet viewer-state flags in a single round trip.
///
/// This is a pull-based feed (computed at read time). Fine at moderate scale;
/// swap to a fan-out-on-write feed table if you outgrow it.
pub async fn get_feed(
    pool: &PgPool,
    viewer_id: Uuid,
    limit: i64,
    before: Option<DateTime<Utc>>,
) -> Result<Vec<TweetWithAuthor>, AppError> {
    let tweets = sqlx::query_as!(
        TweetWithAuthor,
        r#"
        SELECT
            t.id,
            t.content,
            t.reply_to_id,
            t.quote_tweet_id,
            t.like_count,
            t.retweet_count,
            t.reply_count,
            t.created_at,
            u.id   AS author_id,
            u.username AS author_username,
            u.display_name AS author_display_name,
            u.avatar_url AS author_avatar_url,
            EXISTS(SELECT 1 FROM likes l WHERE l.tweet_id = t.id AND l.user_id = $1) AS "liked_by_viewer!",
            EXISTS(SELECT 1 FROM retweets r WHERE r.tweet_id = t.id AND r.user_id = $1) AS "retweeted_by_viewer!"
        FROM tweets t
        JOIN users u ON u.id = t.user_id
        WHERE (
            t.user_id = $1
            OR t.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
        )
        AND ($2::timestamptz IS NULL OR t.created_at < $2)
        ORDER BY t.created_at DESC
        LIMIT $3
        "#,
        viewer_id,
        before,
        limit,
    )
    .fetch_all(pool)
    .await?;

    Ok(tweets)
}
