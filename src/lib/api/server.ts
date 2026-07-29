/**
 * Fetch helper for server components hitting public storefront endpoints.
 *
 * The relative `/api/v1` rewrite only exists for the browser, so on the
 * server we go straight to the Express backend (same env var the rewrite in
 * next.config.ts uses). Authenticated calls stay client-side through
 * `client.ts` — the refresh cookie never reaches this server by design
 * (docs/auth.md).
 */

const API_URL = process.env.API_URL ?? "http://localhost:5000";

export async function publicApiFetch<T>(
  path: string,
  { revalidate = 300 }: { revalidate?: number } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed with status ${res.status}`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}
