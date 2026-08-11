use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Tweet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub content: String,
    pub reply_to_id: Option<Uuid>,
    pub quote_tweet_id: Option<Uuid>,
    pub like_count: i32,
    pub retweet_count: i32,
    pub reply_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTweet {
    pub content: String,
    pub reply_to_id: Option<Uuid>,
    pub quote_tweet_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct Pagination {
    pub limit: Option<i64>,
    pub before: Option<DateTime<Utc>>,
}

/// Denormalized row for feed/timeline reads — tweet + author info + whether
/// the requesting user has liked/retweeted it, all in one JOIN instead of N+1 queries.
#[derive(Debug, Serialize, FromRow)]
pub struct TweetWithAuthor {
    pub id: Uuid,
    pub content: String,
    pub reply_to_id: Option<Uuid>,
    pub quote_tweet_id: Option<Uuid>,
    pub like_count: i32,
    pub retweet_count: i32,
    pub reply_count: i32,
    pub created_at: DateTime<Utc>,
    pub author_id: Uuid,
    pub author_username: String,
    pub author_display_name: Option<String>,
    pub author_avatar_url: Option<String>,
    pub liked_by_viewer: bool,
    pub retweeted_by_viewer: bool,
}
