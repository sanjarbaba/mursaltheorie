export const API_VERSION = '1';

export function ok(data, status = 200, headers = {}) {
  return Response.json({ data }, {
    status,
    headers: {
      'API-Version': API_VERSION,
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      ...headers
    }
  });
}

export function fail(code, message, status = 400, details) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return Response.json({ error }, {
    status,
    headers: {
      'API-Version': API_VERSION,
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'"
    }
  });
}

export function integer(value, { min, max }) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

export function locale(value) {
  return ['fa', 'ps'].includes(value) ? value : 'nl';
}

export function localized(value, language) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return value[language] || value.nl || value.fa || value.ps || '';
}

export function requestId(request) {
  return request.headers.get('x-request-id') || crypto.randomUUID();
}

