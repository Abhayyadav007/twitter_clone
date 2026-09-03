import { apiRequest } from './client';
import type { FollowCounts } from '../types';

export function follow(targetId: string): Promise<void> {
  return apiRequest<void>(`/follows/${targetId}`, {
    method: 'POST',
    auth: true,
  });
}

export function unfollow(targetId: string): Promise<void> {
  return apiRequest<void>(`/follows/${targetId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function getFollowCounts(userId: string): Promise<FollowCounts> {
  return apiRequest<FollowCounts>(`/follows/counts/${userId}`);
}
