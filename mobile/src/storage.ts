import * as Crypto from 'expo-crypto';
import Storage from 'expo-sqlite/kv-store';
import type { Lesson, LessonsResponse, Locale, ProgressMutation } from './types';

const lessonsKey = (locale: string) => `lessons:v2:${locale}`;
const lessonsCachedAtKey = (locale: string) => `lessons:v2:cached-at:${locale}`;
const queueKey = (userId: string) => `progress-queue:v1:${userId}`;
const localeKey = 'app-locale:v1';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function cacheLessons(response: LessonsResponse) {
  await Storage.setItem(lessonsKey(response.locale), JSON.stringify(response));
  await Storage.setItem(lessonsCachedAtKey(response.locale), String(Date.now()));
}

export async function readCachedLessons(locale: Locale = 'nl'): Promise<LessonsResponse | null> {
  const value = await Storage.getItem(lessonsKey(locale));
  if (!value) return null;
  try { return JSON.parse(value) as LessonsResponse; } catch { return null; }
}

export async function isLessonsCacheFresh(locale: Locale = 'nl') {
  const value = await Storage.getItem(lessonsCachedAtKey(locale));
  const cachedAt = Number(value || 0);
  return cachedAt > 0 && Date.now() - cachedAt < CACHE_MAX_AGE_MS;
}

export async function readCachedLesson(id: number, locale: Locale = 'nl'): Promise<Lesson | null> {
  const cache = await readCachedLessons(locale);
  return cache?.lessons.find((lesson) => lesson.id === id) || null;
}

export async function readPreferredLocale(): Promise<Locale> {
  const value = await Storage.getItem(localeKey);
  return value === 'fa' || value === 'ps' ? value : 'nl';
}

export async function savePreferredLocale(locale: Locale) {
  await Storage.setItem(localeKey, locale);
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
