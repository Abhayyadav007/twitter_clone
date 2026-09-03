import { apiRequest } from './client';
import type { UpdateUserRequest, User, UserPublic } from '../types';

export function getMe(): Promise<User> {
  return apiRequest<User>('/users/me', { auth: true });
}

export function updateMe(body: UpdateUserRequest): Promise<UserPublic> {
  return apiRequest<UserPublic>('/users/me', {
    method: 'PATCH',
    body,
    auth: true,
  });
}

export function getUserByUsername(username: string): Promise<UserPublic> {
  return apiRequest<UserPublic>(`/users/${encodeURIComponent(username)}`);
}
