mod error;
mod features;
mod routes;
mod state;

use std::net::SocketAddr;
use std::time::Duration;

use sqlx::postgres::PgPoolOptions;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(std::env::var("RUST_LOG").unwrap_or_else(|_| "info,sqlx=warn".into()))
        .init();

    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set (see .env.example)");
    let jwt_secret =
        std::env::var("JWT_SECRET").expect("JWT_SECRET must be set (see .env.example)");

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    let state = AppState { pool, jwt_secret };

    let cors_origin = std::env::var("CORS_ORIGIN").ok();
    let cors = if let Some(origin) = cors_origin {
        let value = origin.parse::<axum::http::HeaderValue>()?;
        CorsLayer::new()
            .allow_origin(tower_http::cors::AllowOrigin::exact(value))
            .allow_methods([
                axum::http::Method::GET,
                axum::http::Method::POST,
                axum::http::Method::PATCH,
                axum::http::Method::DELETE,
            ])
            .allow_headers([
                axum::http::header::CONTENT_TYPE,
                axum::http::header::AUTHORIZATION,
            ])
    } else {
        tracing::warn!("CORS_ORIGIN not set; using permissive CORS for local development");
        CorsLayer::permissive()
    };

    let app = routes::app_routes()
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr: SocketAddr = std::env::var("BIND_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:8080".into())
        .parse()?;

    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
