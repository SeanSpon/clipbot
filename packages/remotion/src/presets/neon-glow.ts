import type { Preset } from '../types';

export const neonGlow: Preset = {
  name: 'neon-glow',

  captionStyle: {
    style: 'neon-glow',
    fontSize: 48,
    fontWeight: 700,
    fontFamily: 'Inter, Arial, sans-serif',
    textTransform: 'uppercase',
    position: 'center',
    padding: 12,
    borderRadius: 8,
    glowColor: '#00BFFF',
    glowIntensity: 30,
    shadow: '0 0 20px #00BFFF, 0 0 40px #00BFFF60',
  },

  typographyDefaults: {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 68,
    fontWeight: 800,
    color: '#FFFFFF',
    shadow: '0 0 30px #00BFFF, 0 0 60px #00BFFF50, 0 0 90px #00BFFF30',
  },

  transitionDefaults: {
    type: 'fade',
    durationFrames: 10,
  },

  colorScheme: {
    primary: '#00BFFF',
    secondary: '#7B2FBE',
    accent: '#00FF88',
    background: '#0A0A1A',
    text: '#FFFFFF',
    highlight: '#00BFFF',
  },
};
