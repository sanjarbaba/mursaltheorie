export type GetToken = () => Promise<string | null>;

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'https://www.mursaltheorie.nl').replace(/\/$/, '');

type ApiErrorBody = { error?: { code?: string; message?: string } };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function createApiClient(getToken: GetToken) {
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    if (!token) throw new ApiError(401, 'AUTH_REQUIRED', 'Inloggen is vereist.');

    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers
      }
    });
    const body = await response.json().catch(() => ({})) as ApiErrorBody & { data?: T };
    if (!response.ok) {
      throw new ApiError(response.status, body.error?.code || 'API_ERROR', body.error?.message || 'Verzoek mislukt.');
    }
    return body.data as T;
  };
}

