import { apiRequest } from './client';

export function likeTweet(tweetId: string): Promise<void> {
  return apiRequest<void>(`/likes/${tweetId}`, {
    method: 'POST',
    auth: true,
  });
}

export function unlikeTweet(tweetId: string): Promise<void> {
  return apiRequest<void>(`/likes/${tweetId}`, {
    method: 'DELETE',
    auth: true,
  });
}
