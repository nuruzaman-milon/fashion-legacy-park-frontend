/**
 * In-memory home for the access token. Deliberately not localStorage or a
 * readable cookie — memory is the only place an XSS payload cannot enumerate.
 * The token dies with the tab; the httpOnly refresh cookie brings the session
 * back on the next bootstrap (see refresh.ts).
 *
 * Client-only: importing this from server code would share one token across
 * every request.
 */

type Listener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) listener(token);
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

/** Subscribe to token changes. Returns an unsubscribe function. */
export function onTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
