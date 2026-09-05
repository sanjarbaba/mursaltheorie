import access from './access.js';
import devices from './devices.js';
import examAttempts from './exam-attempts.js';
import exams from './exams.js';
import index from './index.js';
import lessons from './lessons.js';
import me from './me.js';
import progress from './progress.js';
import { fail } from './_contract.js';

const endpoints = Object.freeze({
  access,
  devices,
  'exam-attempts': examAttempts,
  exams,
  index,
  lessons,
  me,
  progress
});

export default async function handler(request) {
  const endpoint = new URL(request.url).searchParams.get('__endpoint');
  const target = endpoints[endpoint];
  if (!target) return fail('ENDPOINT_NOT_FOUND', 'API-endpoint niet gevonden.', 404);
  if (typeof target === 'function') return target(request);
  if (typeof target.fetch === 'function') return target.fetch(request);
  return fail('ENDPOINT_UNAVAILABLE', 'API-endpoint niet beschikbaar.', 503);
}
