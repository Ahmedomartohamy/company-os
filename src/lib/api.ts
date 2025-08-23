export class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}
const BASE = import.meta.env.VITE_API_URL || '';
function join(u: string, p: string) {
  return u.replace(/\/$/, '') + '/' + p.replace(/^\//, '');
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = BASE ? join(BASE, path) : path;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json() as Promise<T>;
}
