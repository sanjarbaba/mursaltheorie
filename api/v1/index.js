import * as access from './access.js';
import * as activity from './activity.js';
import * as admin from './admin.js';
import * as devices from './devices.js';
import * as examAttempts from './exam-attempts.js';
import * as exams from './exams.js';
import * as lessons from './lessons.js';
import * as me from './me.js';
import * as progress from './progress.js';
import * as reviews from './reviews.js';
import { API_VERSION, fail, ok } from './_contract.js';

const endpoints = Object.freeze({
  access,
  activity,
  admin,
  devices,
  'exam-attempts': examAttempts,
  exams,
  lessons,
  me,
  progress,
  reviews
});

export default async function handler(request) {
  const endpoint = new URL(request.url).searchParams.get('__endpoint');
  if (!endpoint) {
    if (request.method !== 'GET') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    return ok({ service: 'mursaltheorie-api', version: API_VERSION, status: 'ok' });
  }
  const target = endpoints[endpoint];
  if (!target) return fail('ENDPOINT_NOT_FOUND', 'API-endpoint niet gevonden.', 404);
  const native = target[request.method];
  if (typeof native === 'function') return native(request);
  if (typeof target.default === 'function') return target.default(request);
  if (typeof target.default?.fetch === 'function') return target.default.fetch(request);
  return fail('ENDPOINT_UNAVAILABLE', 'API-endpoint niet beschikbaar.', 503);
}

