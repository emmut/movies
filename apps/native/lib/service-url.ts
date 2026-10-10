type ServiceUrlOptions = {
  explicitUrl?: string;
  browserOrigin?: string;
  expoHost?: string;
  port: number;
};

export function resolveServiceUrl({
  explicitUrl,
  browserOrigin,
  expoHost,
  port,
}: ServiceUrlOptions) {
  if (explicitUrl?.trim()) return explicitUrl.trim().replace(/\/$/, '');
  const host = browserOrigin ?? (expoHost ? `http://${expoHost}` : 'http://localhost');
  const url = new URL(host);
  url.port = String(port);
  return url.origin;
}
