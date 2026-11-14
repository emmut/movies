/** Refresh on browser/device return, because another consumer may have saved account preferences. */
export function subscribeToPreferenceRefresh(
  refresh: () => void,
  browser: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
  page: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'> = document,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  function onReturn() {
    if (page.visibilityState !== 'visible') {
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(refresh, 0);
  }
  browser.addEventListener('focus', onReturn);
  page.addEventListener('visibilitychange', onReturn);
  return function unsubscribe() {
    clearTimeout(timer);
    browser.removeEventListener('focus', onReturn);
    page.removeEventListener('visibilitychange', onReturn);
  };
}
