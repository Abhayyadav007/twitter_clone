use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;

use super::model::Claims;

pub const ACCESS_TOKEN_TTL_MINS: i64 = 15;
pub const REFRESH_TOKEN_TTL_DAYS: i64 = 30;

pub fn create_access_token(
    user_id: Uuid,
    username: &str,
    secret: &str,
) -> Result<String, jsonwebtoken::errors::Error> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id,
        username: username.to_string(),
        iat: now.timestamp() as usize,
        exp: (now + Duration::minutes(ACCESS_TOKEN_TTL_MINS)).timestamp() as usize,
    };

    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

/// Opaque random refresh token — NOT a JWT. Only its hash is stored server-side,
/// same reasoning as password storage: a DB leak shouldn't leak usable tokens.
pub fn create_refresh_token() -> String {
    format!("{}{}", Uuid::new_v4(), Uuid::new_v4())
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.leeway = 5; // seconds of clock-skew tolerance

    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )?;
    Ok(data.claims)
}
