import {
  passkeyNameSchema,
  passkeyRegistrationOptionsSchema,
  passkeyAuthenticationOptionsSchema,
  passkeyCredentialSchema,
  type PasskeyRegistrationOptions,
  type PasskeyAuthenticationOptions,
} from '@movies/api/passkeys';

type Result = { data: unknown; error: unknown };
type RequestOptions = {
  method: 'GET' | 'POST';
  query?: { name: string };
  body?: Record<string, unknown>;
};
type Sources = {
  available: () => boolean;
  request: (path: string, options: RequestOptions) => Promise<Result>;
  register: (options: PasskeyRegistrationOptions) => Promise<unknown>;
  authenticate: (options: PasskeyAuthenticationOptions) => Promise<unknown>;
};
function failure(code: string): Result {
  return { data: null, error: { code } };
}
function cancelled(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const names = [
    'NotAllowedError',
    'UserCancelled',
    'UserCancelledException',
    'ERR_USER_CANCELLED',
  ];
  if ('message' in error && error.message === 'UserCancelled') {
    return true;
  }
  return (
    ('name' in error && names.includes(String(error.name))) ||
    ('code' in error && names.includes(String(error.code)))
  );
}
/** The same challenge/verification protocol as the official browser client, using OS credentials. */
export function createPasskeyCeremony(sources: Sources) {
  async function credential(ceremony: 'registration' | 'authentication', options: unknown) {
    if (ceremony === 'registration') {
      return sources.register(passkeyRegistrationOptionsSchema.parse(options));
    }
    return sources.authenticate(passkeyAuthenticationOptionsSchema.parse(options));
  }
  async function perform(
    ceremony: 'registration' | 'authentication',
    name?: string,
  ): Promise<Result> {
    if (!sources.available()) {
      return failure('PASSKEY_UNAVAILABLE');
    }
    try {
      const registration = ceremony === 'registration';
      const query = registration ? { name: passkeyNameSchema.parse(name) } : undefined;
      const options = await sources.request(
        '/passkey/generate-' + (registration ? 'register' : 'authenticate') + '-options',
        { method: 'GET', query },
      );
      if (options.error) {
        return options;
      }
      if (!options.data) {
        return failure('PASSKEY_FAILED');
      }
      const result = await credential(ceremony, options.data);
      if (!result) {
        return failure('PASSKEY_CANCELLED');
      }
      const { clientExtensionResults: _extensions, ...response } =
        passkeyCredentialSchema.parse(result);
      const body: Record<string, unknown> = { response };
      if (query) {
        body.name = query.name;
      }
      const verified = await sources.request('/passkey/verify-' + ceremony, {
        method: 'POST',
        body,
      });
      if (!verified.error && !verified.data) {
        return failure('PASSKEY_FAILED');
      }
      return verified;
    } catch (error) {
      return failure(cancelled(error) ? 'PASSKEY_CANCELLED' : 'PASSKEY_FAILED');
    }
  }
  return {
    add(name: string) {
      return perform('registration', name);
    },
    signIn() {
      return perform('authentication');
    },
  };
}
