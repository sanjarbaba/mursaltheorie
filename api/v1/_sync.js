const DEVICE_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const MUTATION_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

function identifier(value, { min, max, pattern }) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length >= min && normalized.length <= max && pattern.test(normalized)
    ? normalized
    : null;
}

export function deviceId(value) {
  return identifier(value, { min: 8, max: 120, pattern: DEVICE_ID_PATTERN });
}

export function syncMutationId(value) {
  return identifier(value, { min: 8, max: 120, pattern: MUTATION_ID_PATTERN });
}

export function platform(value) {
  return ['web', 'ios', 'android'].includes(value) ? value : null;
}

export function clientTimestamp(value, now = Date.now()) {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp > now + 5 * 60 * 1000) return null;
  return new Date(timestamp).toISOString();
}

export function shouldApplyProgress(current, incoming) {
  const currentTime = current ? Date.parse(current) : Number.NEGATIVE_INFINITY;
  const incomingTime = Date.parse(incoming);
  return Number.isFinite(incomingTime) && (!Number.isFinite(currentTime) || incomingTime >= currentTime);
}

