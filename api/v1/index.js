import access from './access.js';
import devices from './devices.js';
import examAttempts from './exam-attempts.js';
import exams from './exams.js';
import lessons from './lessons.js';
import me from './me.js';
import progress from './progress.js';
import { API_VERSION, fail, ok } from './_contract.js';

const endpoints = Object.freeze({
  access,
  devices,
  'exam-attempts': examAttempts,
  exams,
  lessons,
  me,
  progress
});

export default async function handler(request) {
  const endpoint = new URL(request.url).searchParams.get('__endpoint');
  if (!endpoint) {
    if (request.method !== 'GET') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    return ok({ service: 'mursaltheorie-api', version: API_VERSION, status: 'ok' });
  }
  const target = endpoints[endpoint];
  if (!target) return fail('ENDPOINT_NOT_FOUND', 'API-endpoint niet gevonden.', 404);
  if (typeof target === 'function') return target(request);
  if (typeof target.fetch === 'function') return target.fetch(request);
  return fail('ENDPOINT_UNAVAILABLE', 'API-endpoint niet beschikbaar.', 503);
}
