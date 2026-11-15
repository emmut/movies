// @vitest-environment happy-dom
import { getPasskeyActions } from '@better-auth/passkey/client';
import { classifyPasskeyError } from '@movies/api/passkeys';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

afterEach(() => vi.unstubAllGlobals());
const registration = {
  challenge: 'Y2hhbGxlbmdl',
  rp: { id: 'localhost', name: 'Movies' },
  user: { id: 'dXNlcg', name: 'Account', displayName: 'Account' },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
};

describe.each(['registration', 'authentication'])('Better Auth %s error boundary', (ceremony) => {
  it.each(['NotAllowedError', 'SecurityError', 'UnknownError'])(
    'preserves the actual %s cause without submitting verification',
    async (name) => {
      vi.stubGlobal('PublicKeyCredential', class Credential {});
      const cause = new DOMException('prompt failed', name);
      const prompt = vi.fn().mockRejectedValue(cause);
      Object.defineProperty(navigator, 'credentials', {
        configurable: true,
        value: { create: prompt, get: prompt },
      });
      const options =
        ceremony === 'registration'
          ? registration
          : { challenge: registration.challenge, rpId: 'localhost' };
      const fetcher = vi.fn().mockResolvedValue({ data: options });
      const actions = getPasskeyActions(
        fetcher as unknown as Parameters<typeof getPasskeyActions>[0],
        { $listPasskeys: { set: vi.fn() }, $store: { notify: vi.fn() } } as unknown as Parameters<
          typeof getPasskeyActions
        >[1],
      );
      const result =
        ceremony === 'registration'
          ? await actions.passkey.addPasskey({ name: 'Phone' })
          : await actions.signIn.passkey();
      expect(prompt).toHaveBeenCalledOnce();
      expect(result.error).toHaveProperty('cause', cause);
      expect(classifyPasskeyError(result.error)).toBe(
        name === 'NotAllowedError' ? 'cancelled' : 'failed',
      );
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
});
