import type { Preset } from '../types';
import { viralPopup } from './viral-popup';
import { cleanMinimal } from './clean-minimal';
import { boldImpact } from './bold-impact';
import { neonGlow } from './neon-glow';

export { viralPopup } from './viral-popup';
export { cleanMinimal } from './clean-minimal';
export { boldImpact } from './bold-impact';
export { neonGlow } from './neon-glow';

export const presets: Record<string, Preset> = {
  'viral-popup': viralPopup,
  'clean-minimal': cleanMinimal,
  'bold-impact': boldImpact,
  'neon-glow': neonGlow,
};

export function getPreset(name: string): Preset {
  const preset = presets[name];
  if (!preset) {
    throw new Error(
      `Unknown preset "${name}". Available: ${Object.keys(presets).join(', ')}`,
    );
  }
  return preset;
}
