import { hasErrorCode } from '@movies/api/errors';
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
  return ('name' in error && names.includes(String(error.name))) || hasErrorCode(error, ...names);
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
      const query = registrationQuery(ceremony, name);
      const options = await sources.request(optionsPath(ceremony), { method: 'GET', query });
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
      return verificationResult(verified);
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

function registrationQuery(ceremony: 'registration' | 'authentication', name?: string) {
  if (ceremony === 'registration') {
    return { name: passkeyNameSchema.parse(name) };
  }
  return undefined;
}
function optionsPath(ceremony: 'registration' | 'authentication') {
  const action = ceremony === 'registration' ? 'register' : 'authenticate';
  return '/passkey/generate-' + action + '-options';
}

function verificationResult(result: Result) {
  if (!result.error && !result.data) {
    return failure('PASSKEY_FAILED');
  }
  return result;
}
