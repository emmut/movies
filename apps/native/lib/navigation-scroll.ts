let activeCapture: (() => void) | null = null;

/** Only the focused screen supplies a capture; old blur cleanup cannot unregister its successor. */
export function registerScrollCapture(capture: () => void) {
  activeCapture = capture;
  return function unregister() {
    if (activeCapture === capture) {
      activeCapture = null;
    }
  };
}
export function captureActiveScroll() {
  activeCapture?.();
}
