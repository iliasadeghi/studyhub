/**
 * Prefix a root-relative asset path ("/notes/x.svg") with the app's base URL,
 * so assets resolve both locally ("/") and on GitHub Pages ("/<repo>/").
 * Absolute URLs and relative paths are returned unchanged.
 */
export function withBase(path: string | undefined): string | undefined {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
}
