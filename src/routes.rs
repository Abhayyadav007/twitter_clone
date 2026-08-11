use axum::Router;

use crate::features::{auth, follows, likes, tweets, users};
use crate::state::AppState;

pub fn app_routes() -> Router<AppState> {
    Router::new()
        .nest("/api/auth", auth::routes::routes())     // public: register/login/refresh
        .nest("/api/users", users::routes::routes())   // /me routes use CurrentUser extractor internally
        .nest("/api/tweets", tweets::routes::routes())
        .nest("/api/follows", follows::routes::routes())
        .nest("/api/likes", likes::routes::routes())
}
