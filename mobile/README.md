# BlueGram — React Native (Expo) client

Mobile app for the Axum twitter-clone API.

## Setup

```bash
cd mobile
cp .env.example .env
# edit EXPO_PUBLIC_API_URL if needed
npm install --legacy-peer-deps
npm start
```

## API connectivity

| Environment      | `EXPO_PUBLIC_API_URL`   |
| ---------------- | ----------------------- |
| iOS Simulator    | `http://localhost:8080` |
| Android Emulator | `http://10.0.2.2:8080`  |
| Physical device  | `http://<LAN-IP>:8080`  |

Ensure the Rust backend is running (`cargo run` from repo root) and Postgres is up.

## Features

- Register / login / logout with JWT + refresh rotation
- Home timeline with pull-to-refresh and cursor pagination
- Compose posts (280 chars)
- Like / unlike
- Profile edit + follow counts
- Public user profiles with follow/unfollow
- Post detail + owner delete

Tokens are stored in Expo SecureStore (Keychain / EncryptedSharedPreferences).
