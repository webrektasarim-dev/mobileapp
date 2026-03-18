const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setToken(t: string) {
  localStorage.setItem('admin_token', t);
}

export function clearToken() {
  localStorage.removeItem('admin_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as object),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
