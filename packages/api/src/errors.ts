/** Read only an error's own code; inherited properties must not classify a response. */
export function hasErrorCode(error: unknown, ...codes: string[]): boolean {
  if (typeof error !== 'object' || error === null || !Object.hasOwn(error, 'code')) {
    return false;
  }
  const { code } = error as { code: unknown };
  return typeof code === 'string' && codes.includes(code);
}
