use axum::{
    extract::{Path, Query, State},
    Json,
};
use uuid::Uuid;

use crate::error::AppError;
use crate::features::auth::model::CurrentUser;
use crate::state::AppState;
use super::model::{CreateTweet, Pagination, Tweet, TweetWithAuthor};
use super::repository;

pub async fn create_tweet(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Json(payload): Json<CreateTweet>,
) -> Result<Json<Tweet>, AppError> {
    let trimmed = payload.content.trim();
    if trimmed.is_empty() || trimmed.chars().count() > 280 {
        return Err(AppError::BadRequest("tweet must be 1-280 characters".into()));
    }

    if let Some(parent_id) = payload.reply_to_id {
        repository::find_by_id(&state.pool, parent_id)
            .await?
            .ok_or_else(|| AppError::NotFound("reply_to tweet not found".into()))?;
    }

    let tweet = repository::create(&state.pool, current_user.id, payload).await?;
    Ok(Json(tweet))
}

pub async fn get_tweet(
    State(state): State<AppState>,
    Path(tweet_id): Path<Uuid>,
) -> Result<Json<Tweet>, AppError> {
    let tweet = repository::find_by_id(&state.pool, tweet_id)
        .await?
        .ok_or_else(|| AppError::NotFound("tweet not found".into()))?;

    Ok(Json(tweet))
}

pub async fn delete_tweet(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Path(tweet_id): Path<Uuid>,
) -> Result<(), AppError> {
    let tweet = repository::find_by_id(&state.pool, tweet_id)
        .await?
        .ok_or_else(|| AppError::NotFound("tweet not found".into()))?;

    if tweet.user_id != current_user.id {
        return Err(AppError::Forbidden("you can only delete your own tweets".into()));
    }

    repository::delete(&state.pool, tweet_id).await?;
    Ok(())
}

pub async fn get_user_tweets(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Query(page): Query<Pagination>,
) -> Result<Json<Vec<Tweet>>, AppError> {
    let limit = page.limit.unwrap_or(20).clamp(1, 50);
    let tweets = repository::find_by_user(&state.pool, user_id, limit, page.before).await?;
    Ok(Json(tweets))
}

pub async fn get_timeline(
    State(state): State<AppState>,
    current_user: CurrentUser,
    Query(page): Query<Pagination>,
) -> Result<Json<Vec<TweetWithAuthor>>, AppError> {
    let limit = page.limit.unwrap_or(20).clamp(1, 50);
    let tweets = repository::get_feed(&state.pool, current_user.id, limit, page.before).await?;
    Ok(Json(tweets))
}
