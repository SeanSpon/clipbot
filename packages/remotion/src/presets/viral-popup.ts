import type { Preset } from '../types';

export const viralPopup: Preset = {
  name: 'viral-popup',

  captionStyle: {
    style: 'viral-popup',
    fontSize: 64,
    fontWeight: 900,
    fontFamily: 'Inter, Arial, sans-serif',
    textTransform: 'uppercase',
    position: 'center',
    padding: 12,
    borderRadius: 8,
    shadow: '0 4px 30px rgba(0,0,0,0.6)',
  },

  typographyDefaults: {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 80,
    fontWeight: 900,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    shadow: '0 4px 20px rgba(0,0,0,0.5)',
  },

  transitionDefaults: {
    type: 'quick-cut',
    durationFrames: 6,
    flashColor: '#FFFFFF',
  },

  colorScheme: {
    primary: '#FF3B30',
    secondary: '#FF9500',
    accent: '#FFD700',
    background: '#000000',
    text: '#FFFFFF',
    highlight: '#FFD700',
  },
};
