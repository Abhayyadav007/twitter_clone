import { apiRequest } from './client';
import type { CreateTweetRequest, Tweet, TweetWithAuthor } from '../types';

export type TimelineParams = {
  limit?: number;
  before?: string;
};

function paginationQuery(params?: TimelineParams): string {
  const q = new URLSearchParams();
  if (params?.limit != null) {
    q.set('limit', String(params.limit));
  }
  if (params?.before) {
    q.set('before', params.before);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function getTimeline(params?: TimelineParams): Promise<TweetWithAuthor[]> {
  return apiRequest<TweetWithAuthor[]>(`/tweets${paginationQuery(params)}`, {
    auth: true,
  });
}

export function createTweet(body: CreateTweetRequest): Promise<Tweet> {
  return apiRequest<Tweet>('/tweets', {
    method: 'POST',
    body,
    auth: true,
  });
}

export function getTweet(id: string): Promise<Tweet> {
  return apiRequest<Tweet>(`/tweets/${id}`);
}

export function deleteTweet(id: string): Promise<void> {
  return apiRequest<void>(`/tweets/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function getTweetsByUser(
  userId: string,
  params?: TimelineParams,
): Promise<Tweet[]> {
  return apiRequest<Tweet[]>(`/tweets/by-user/${userId}${paginationQuery(params)}`);
}
