import * as Crypto from 'expo-crypto';
import Storage from 'expo-sqlite/kv-store';
import type { Lesson, LessonsResponse, ProgressMutation } from './types';

const lessonsKey = (locale: string) => `lessons:v1:${locale}`;
const queueKey = (userId: string) => `progress-queue:v1:${userId}`;

export async function cacheLessons(response: LessonsResponse) {
  await Storage.setItem(lessonsKey(response.locale), JSON.stringify(response));
}

export async function readCachedLessons(locale: 'nl' | 'fa' = 'nl'): Promise<LessonsResponse | null> {
  const value = await Storage.getItem(lessonsKey(locale));
  if (!value) return null;
  try { return JSON.parse(value) as LessonsResponse; } catch { return null; }
}

export async function readCachedLesson(id: number, locale: 'nl' | 'fa' = 'nl'): Promise<Lesson | null> {
  const cache = await readCachedLessons(locale);
  return cache?.lessons.find((lesson) => lesson.id === id) || null;
}

export async function enqueueProgress(userId: string, mutation: Omit<ProgressMutation, 'mutationId'>) {
  const key = queueKey(userId);
  const current = await readProgressQueue(userId);
  const queued: ProgressMutation = { ...mutation, mutationId: Crypto.randomUUID() };
  current.push(queued);
  await Storage.setItem(key, JSON.stringify(current));
  return queued;
}

export async function readProgressQueue(userId: string): Promise<ProgressMutation[]> {
  const value = await Storage.getItem(queueKey(userId));
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as ProgressMutation[] : [];
  } catch {
    return [];
  }
}

export async function flushProgressQueue(
  userId: string,
  request: <T>(path: string, init?: RequestInit) => Promise<T>
) {
  const key = queueKey(userId);
  const queue = await readProgressQueue(userId);
  while (queue.length) {
    await request('/api/v1/progress', { method: 'PUT', body: JSON.stringify(queue[0]) });
    queue.shift();
    await Storage.setItem(key, JSON.stringify(queue));
  }
}

