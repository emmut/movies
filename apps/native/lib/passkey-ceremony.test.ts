import { createPasskeyCeremony } from '@native/lib/passkey-ceremony';
import { describe, expect, it, vi } from 'vite-plus/test';

const registration = {
  challenge: 'challenge',
  rp: { id: 'auth.example.com', name: 'Movies' },
  user: { id: 'user', name: 'Account', displayName: 'Account' },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
};
const authentication = { challenge: 'challenge', rpId: 'auth.example.com' };
const credential = {
  id: 'credential',
  rawId: 'credential',
  type: 'public-key',
  response: { clientDataJSON: 'client-data' },
  clientExtensionResults: {},
};
function setup() {
  const request = vi
    .fn()
    .mockResolvedValueOnce({ data: registration, error: null })
    .mockResolvedValueOnce({ data: { passkey: { id: 'created' } }, error: null });
  const register = vi.fn().mockResolvedValue(credential);
  const authenticate = vi.fn().mockResolvedValue(credential);
  const available = vi.fn().mockReturnValue(true);
  return {
    request,
    register,
    authenticate,
    available,
    flow: createPasskeyCeremony({ request, register, authenticate, available }),
  };
}
describe('native passkey challenge protocol', () => {
  it('passes the registration challenge to the OS and verifies the credential with a trimmed name', async () => {
    const { flow, request, register } = setup();
    expect((await flow.add(' My phone ')).error).toBeNull();
    expect(request.mock.calls[0]).toEqual([
      '/passkey/generate-register-options',
      { method: 'GET', query: { name: 'My phone' } },
    ]);
    expect(register).toHaveBeenCalledWith(registration);
    const { clientExtensionResults: _extension, ...body } = credential;
    expect(request.mock.calls[1]).toEqual([
      '/passkey/verify-registration',
      { method: 'POST', body: { response: body, name: 'My phone' } },
    ]);
  });
  it('uses authentication options and the authentication verification endpoint', async () => {
    const { flow, request, authenticate, register } = setup();
    request
      .mockReset()
      .mockResolvedValueOnce({ data: authentication, error: null })
      .mockResolvedValueOnce({ data: { user: { id: 'user' } }, error: null });
    expect((await flow.signIn()).error).toBeNull();
    expect(authenticate).toHaveBeenCalledWith(authentication);
    expect(register).not.toHaveBeenCalled();
    expect(request.mock.calls[1][0]).toBe('/passkey/verify-authentication');
  });
  it('does not contact auth or native credentials when the build does not support passkeys', async () => {
    const { flow, available, request, register } = setup();
    available.mockReturnValue(false);
    expect((await flow.add('Phone')).error).toEqual({ code: 'PASSKEY_UNAVAILABLE' });
    expect(request).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });
  it('rejects an empty name before starting a challenge', async () => {
    const { flow, request } = setup();
    expect((await flow.add(' ')).error).toEqual({ code: 'PASSKEY_FAILED' });
    expect(request).not.toHaveBeenCalled();
  });
  it('retains auth failures without invoking the device', async () => {
    const { flow, request, register } = setup();
    request.mockReset().mockResolvedValue({ data: null, error: { status: 401 } });
    expect((await flow.add('Phone')).error).toEqual({ status: 401 });
    expect(register).not.toHaveBeenCalled();
  });
  it.each([
    null,
    {},
    { ...registration, challenge: '' },
    { ...registration, rp: { name: 'Movies' } },
  ])('rejects absent/malformed challenge data before invoking the device', async (data) => {
    const { flow, request, register } = setup();
    request.mockReset().mockResolvedValue({ data, error: null });
    expect((await flow.add('Phone')).error).toEqual({ code: 'PASSKEY_FAILED' });
    expect(register).not.toHaveBeenCalled();
  });
  it.each([null, new DOMException('cancelled', 'NotAllowedError'), { code: 'UserCancelled' }])(
    'does not verify cancelled credentials',
    async (cancel) => {
      const { flow, request, register } = setup();
      if (cancel) {
        register.mockRejectedValue(cancel);
      } else {
        register.mockResolvedValue(null);
      }
      expect((await flow.add('Phone')).error).toEqual({ code: 'PASSKEY_CANCELLED' });
      expect(request).toHaveBeenCalledTimes(1);
    },
  );
  it('rejects a malformed native credential without sending it to verification', async () => {
    const { flow, request, register } = setup();
    register.mockResolvedValue({ id: 'incomplete' });
    expect((await flow.add('Phone')).error).toEqual({ code: 'PASSKEY_FAILED' });
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('never claims a passkey was saved if verification fails or has no result', async () => {
    for (const result of [
      { data: null, error: { status: 400 } },
      { data: null, error: null },
    ]) {
      const { flow, request } = setup();
      request
        .mockReset()
        .mockResolvedValueOnce({ data: registration, error: null })
        .mockResolvedValueOnce(result);
      expect((await flow.add('Phone')).error).toBeTruthy();
    }
  });
});
