export type UserPublic = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  verified: boolean;
  created_at: string;
};

export type User = UserPublic & {
  email: string;
  updated_at: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: UserPublic;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type RefreshRequest = {
  refresh_token: string;
  user_id: string;
};

export type UpdateUserRequest = {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
};

export type Tweet = {
  id: string;
  user_id: string;
  content: string;
  reply_to_id: string | null;
  quote_tweet_id: string | null;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
};

export type TweetWithAuthor = {
  id: string;
  content: string;
  reply_to_id: string | null;
  quote_tweet_id: string | null;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  created_at: string;
  author_id: string;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  liked_by_viewer: boolean;
  retweeted_by_viewer: boolean;
};

export type CreateTweetRequest = {
  content: string;
  reply_to_id?: string | null;
  quote_tweet_id?: string | null;
};

export type FollowCounts = {
  followers: number;
  following: number;
};

export type ApiErrorBody = {
  error: string;
};
