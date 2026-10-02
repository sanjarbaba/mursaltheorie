import * as Crypto from 'expo-crypto';
import Storage from 'expo-sqlite/kv-store';
import type { Lesson, LessonsResponse, Locale, ProgressMutation } from './types';

const lessonsKey = (userId: string, locale: string) => `lessons:v3:${userId}:${locale}`;
const lessonsCachedAtKey = (userId: string, locale: string) => `lessons:v3:cached-at:${userId}:${locale}`;
const accessLeaseKey = (userId: string) => `course-access:v1:${userId}`;
const queueKey = (userId: string) => `progress-queue:v1:${userId}`;
const localeKey = 'app-locale:v1';
const trainingKey = (userId: string) => `training-progress:v1:${userId}`;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type AccessLease = { locales: Locale[]; validUntil: number };
type AccessGrant = { hasAccess: boolean; locales?: Locale[]; entitlements?: Array<{ ends_at?: string | null }> };

export async function saveAccessLease(userId: string, access: AccessGrant) {
  await clearLegacyLessonCache();
  if (!access.hasAccess) { await clearCachedCourse(userId); return; }
  const now = Date.now();
  const expiries = (access.entitlements || [])
    .map((entitlement) => entitlement.ends_at ? new Date(entitlement.ends_at).getTime() : Infinity)
    .filter((expiry) => Number.isFinite(expiry));
  const validUntil = Math.min(now + CACHE_MAX_AGE_MS, ...expiries);
  const lease: AccessLease = { locales: access.locales?.length ? access.locales : ['nl'], validUntil };
  await Storage.setItem(accessLeaseKey(userId), JSON.stringify(lease));
}

export async function hasOfflineAccess(userId: string, locale: Locale): Promise<boolean> {
  const value = await Storage.getItem(accessLeaseKey(userId));
  if (!value) return false;
  try {
    const lease = JSON.parse(value) as AccessLease;
    return lease.validUntil > Date.now() && Array.isArray(lease.locales) && lease.locales.includes(locale);
  } catch { return false; }
}

export async function cacheLessons(userId: string, response: LessonsResponse) {
  if (!await hasOfflineAccess(userId, response.locale)) return;
  await Storage.setItem(lessonsKey(userId, response.locale), JSON.stringify(response));
  await Storage.setItem(lessonsCachedAtKey(userId, response.locale), String(Date.now()));
}

export async function readCachedLessons(userId: string, locale: Locale = 'nl'): Promise<LessonsResponse | null> {
  if (!await hasOfflineAccess(userId, locale)) return null;
  const value = await Storage.getItem(lessonsKey(userId, locale));
  if (!value) return null;
  try { return JSON.parse(value) as LessonsResponse; } catch { return null; }
}

export async function isLessonsCacheFresh(userId: string, locale: Locale = 'nl') {
  if (!await hasOfflineAccess(userId, locale)) return false;
  const value = await Storage.getItem(lessonsCachedAtKey(userId, locale));
  const cachedAt = Number(value || 0);
  return cachedAt > 0 && Date.now() - cachedAt < CACHE_MAX_AGE_MS;
}

export async function readCachedLesson(userId: string, id: number, locale: Locale = 'nl'): Promise<Lesson | null> {
  const cache = await readCachedLessons(userId, locale);
  return cache?.lessons.find((lesson) => lesson.id === id) || null;
}

export async function clearCachedCourse(userId: string) {
  await Storage.removeItem(accessLeaseKey(userId));
  for (const locale of ['nl', 'fa', 'ps']) {
    await Storage.removeItem(lessonsKey(userId, locale));
    await Storage.removeItem(lessonsCachedAtKey(userId, locale));
  }
}

async function clearLegacyLessonCache() {
  for (const locale of ['nl', 'fa', 'ps']) {
    await Storage.removeItem(`lessons:v2:${locale}`);
    await Storage.removeItem(`lessons:v2:cached-at:${locale}`);
  }
}

export async function clearLocalAccountData(userId: string) {
  await clearCachedCourse(userId);
  await clearLegacyLessonCache();
  await Storage.removeItem(queueKey(userId));
  await Storage.removeItem(trainingKey(userId));
}

export async function readPreferredLocale(): Promise<Locale> {
  const value = await Storage.getItem(localeKey);
  return value === 'fa' || value === 'ps' ? value : 'nl';
}

export async function savePreferredLocale(locale: Locale) {
  await Storage.setItem(localeKey, locale);
}

export type TrainingProgress = { answered: number; correct: number; scenarioIndex: number; clientUpdatedAt: string };

export async function readTrainingProgress(userId: string): Promise<TrainingProgress | null> {
  const value = await Storage.getItem(trainingKey(userId));
  if (!value) return null;
  try { return JSON.parse(value) as TrainingProgress; } catch { return null; }
}

export async function saveTrainingProgress(userId: string, progress: TrainingProgress) {
  await Storage.setItem(trainingKey(userId), JSON.stringify(progress));
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
