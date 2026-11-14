/** React Native sends its securely stored cookie explicitly; browsers own their cookie jar. */
export function createAuthenticatedFetch(
  platform: string,
  getCookie: () => Promise<string>,
  fetcher: typeof fetch = fetch,
): typeof fetch {
  return async function authenticatedFetch(input, init) {
    if (platform === 'web') {
      return fetcher(input, { ...init, credentials: 'include' });
    }
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    headers.delete('cookie');
    const cookie = await getCookie();
    if (cookie) {
      headers.set('cookie', cookie);
    }
    return fetcher(input, { ...init, headers, credentials: 'omit' });
  };
}
