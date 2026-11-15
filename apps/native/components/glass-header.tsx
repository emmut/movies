import { GlassView as NativeGlassView } from 'expo-glass-effect';
import { withUniwind } from 'uniwind';

const GlassView = withUniwind(NativeGlassView);

export function GlassHeader() {
  return <GlassView className="absolute inset-0" glassEffectStyle="regular" />;
}
