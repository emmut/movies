import { hasErrorCode } from '@movies/api/errors';
import {
  PASSKEY_ERROR,
  passkeyNameSchema,
  passkeyRegistrationOptionsSchema,
  passkeyAuthenticationOptionsSchema,
  passkeyCredentialSchema,
  type PasskeyRegistrationOptions,
  type PasskeyAuthenticationOptions,
} from '@movies/api/passkeys';

type Ceremony = 'registration' | 'authentication';
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
const CANCELLATION_NAMES = [
  'NotAllowedError',
  'UserCancelled',
  'UserCancelledException',
  'ERR_USER_CANCELLED',
];

function failure(code: string): Result {
  return { data: null, error: { code } };
}

function errorField(error: unknown, field: 'name' | 'message') {
  if (typeof error !== 'object' || error === null || !(field in error)) {
    return '';
  }
  return String((error as Record<string, unknown>)[field]);
}

function cancelled(error: unknown) {
  if (errorField(error, 'message') === 'UserCancelled') {
    return true;
  }
  if (CANCELLATION_NAMES.includes(errorField(error, 'name'))) {
    return true;
  }
  return hasErrorCode(error, ...CANCELLATION_NAMES);
}

/**
 * iOS bridges ASAuthorizationError.canceled as UserCancelledException / ERR_USER_CANCELLED.
 * Other iOS authorization/configuration failures stay visible as generic failures.
 * Android's Credential Manager reports its failures as message strings:
 * `NoCredentials` when the device holds no passkey for the site, and a DOM
 * `InvalidStateError` when an excluded credential already lives on it.
 */
function deviceErrorCode(error: unknown) {
  if (cancelled(error)) {
    return PASSKEY_ERROR.cancelled;
  }
  const message = errorField(error, 'message');
  if (message === 'NoCredentials') {
    return PASSKEY_ERROR.noCredentials;
  }
  if (errorField(error, 'name') === 'InvalidStateError' || message.includes('InvalidStateError')) {
    return PASSKEY_ERROR.alreadyRegistered;
  }
  return PASSKEY_ERROR.failed;
}

/** The same challenge/verification protocol as the official browser client, using OS credentials. */
export function createPasskeyCeremony(sources: Sources) {
  async function credential(ceremony: Ceremony, options: unknown) {
    if (ceremony === 'registration') {
      return sources.register(passkeyRegistrationOptionsSchema.parse(options));
    }
    return sources.authenticate(passkeyAuthenticationOptionsSchema.parse(options));
  }
  async function perform(ceremony: Ceremony, name?: string): Promise<Result> {
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
        return failure(PASSKEY_ERROR.failed);
      }
      const result = await credential(ceremony, options.data);
      if (!result) {
        return failure(PASSKEY_ERROR.cancelled);
      }
      const { clientExtensionResults: _extensions, ...response } =
        passkeyCredentialSchema.parse(result);
      const body: Record<string, unknown> = { response };
      if (query) {
        body.name = query.name;
      }
      const verified = await sources.request(`/passkey/verify-${ceremony}`, {
        method: 'POST',
        body,
      });
      return verificationResult(verified);
    } catch (error) {
      return failure(deviceErrorCode(error));
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

function registrationQuery(ceremony: Ceremony, name?: string) {
  if (ceremony === 'registration') {
    return { name: passkeyNameSchema.parse(name) };
  }
  return undefined;
}

function optionsPath(ceremony: Ceremony) {
  const action = ceremony === 'registration' ? 'register' : 'authenticate';
  return `/passkey/generate-${action}-options`;
}

function verificationResult(result: Result) {
  if (!result.error && !result.data) {
    return failure(PASSKEY_ERROR.failed);
  }
  return result;
}
