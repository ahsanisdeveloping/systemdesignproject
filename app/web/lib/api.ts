export type User = { id: string; name: string; email: string; created_at: string };
export type Organization = { id: string; name: string; created_at: string };
export type Membership = { user_id: string; organization_id: string; role: "owner" | "admin" | "developer"; created_at: string };
export type RecordItem = User | Organization | Membership;
export type Page<T> = { data: T[]; pagination: { limit: number; offset: number } };
export type FieldError = { field: string; message: string };

export class ApiError extends Error {
  constructor(message: string, public status = 0, public details: FieldError[] = [], public requestId?: string) { super(message); }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options, cache: "no-store",
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError("We couldn’t reach the workspace. Check your connection and try again.");
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.error?.message ?? "The workspace is unavailable. Please try again.", response.status, payload?.error?.details ?? [], payload?.requestId ?? response.headers.get("x-request-id") ?? undefined);
  if (!payload || typeof payload !== "object") throw new ApiError("The server returned an unexpected response.");
  return payload as T;
}

// Phase 1 directory selectors use all pages, rather than silently truncating at 100.
// The guard bounds work until searchable selectors are added to the API.
export async function directory<T>(path: string, signal: AbortSignal): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; offset < 10000; offset += 100) {
    const page = await api<Page<T>>(`${path}?limit=100&offset=${offset}`, { signal });
    if (!Array.isArray(page.data)) throw new ApiError("The directory response is invalid.");
    rows.push(...page.data);
    if (page.data.length < 100) return rows;
  }
  throw new ApiError("This directory is too large to load. Searchable directories are needed for workspaces above 10,000 records.");
}

export const recordId = (row: RecordItem) => "id" in row ? row.id : row.user_id;
export const dateLabel = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
