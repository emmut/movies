export function glassHeaderOptions(platform: string, available: boolean) {
  return {
    headerTransparent: platform === 'ios',
    headerShadowVisible: false,
    headerBlurEffect:
      platform === 'ios' && !available ? ('systemUltraThinMaterial' as const) : undefined,
  };
}

/** Native navigator color props cannot consume CSS tokens or Uniwind classes. */
export function navigationColor(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}
