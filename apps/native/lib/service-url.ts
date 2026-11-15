type ServiceUrlOptions = {
  explicitUrl?: string;
  browserOrigin?: string;
  expoHost?: string;
  port: number;
};

function developmentHost(browserOrigin?: string, expoHost?: string) {
  if (browserOrigin !== undefined) {
    return browserOrigin;
  }
  if (expoHost) {
    return `http://${expoHost}`;
  }
  return 'http://localhost';
}

export function resolveServiceUrl({
  explicitUrl,
  browserOrigin,
  expoHost,
  port,
}: ServiceUrlOptions) {
  const explicit = explicitUrl?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const url = new URL(developmentHost(browserOrigin, expoHost));
  url.port = String(port);
  return url.origin;
}
