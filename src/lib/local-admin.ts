export function isLocalAdminHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false;
  const host = hostHeader.trim().toLowerCase();
  return /^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(host)
    || /^\[::1\](?::\d{1,5})?$/.test(host);
}
