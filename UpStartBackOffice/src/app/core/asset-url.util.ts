import { environment } from '../../environments/environment';

/** API responses return asset paths like `/api/uploads/expenses/...` — already
 * rooted at `/api`, so resolve against the API origin (not apiBaseUrl, which
 * already includes `/api`) to avoid doubling the prefix. Public, no auth
 * needed (matches the API's uploads controller). */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = environment.apiBaseUrl.replace(/\/api\/?$/, '');
  return `${origin}${path}`;
}
