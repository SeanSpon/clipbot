import type { Preset } from '../types';

export const boldImpact: Preset = {
  name: 'bold-impact',

  captionStyle: {
    style: 'bold-impact',
    fontSize: 44,
    fontWeight: 800,
    fontFamily: 'Inter, Arial Black, sans-serif',
    textTransform: 'uppercase',
    position: 'bottom',
    backgroundColor: 'rgba(220, 20, 20, 0.85)',
    padding: 14,
    borderRadius: 0,
    shadow: '0 4px 20px rgba(0,0,0,0.5)',
  },

  typographyDefaults: {
    fontFamily: 'Inter, Arial Black, sans-serif',
    fontSize: 72,
    fontWeight: 900,
    color: '#FFFFFF',
    strokeColor: '#CC0000',
    strokeWidth: 3,
    shadow: '0 4px 15px rgba(0,0,0,0.6)',
  },

  transitionDefaults: {
    type: 'quick-cut',
    durationFrames: 4,
    flashColor: '#000000',
  },

  colorScheme: {
    primary: '#CC0000',
    secondary: '#1C1C1E',
    accent: '#FFFFFF',
    background: '#0A0A0A',
    text: '#FFFFFF',
    highlight: '#FF3B30',
  },
};
