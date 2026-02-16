import type { Preset } from '../types';

export const cleanMinimal: Preset = {
  name: 'clean-minimal',

  captionStyle: {
    style: 'clean-minimal',
    fontSize: 36,
    fontWeight: 500,
    fontFamily: 'Inter, Helvetica, Arial, sans-serif',
    textTransform: 'none',
    position: 'bottom',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 10,
    borderRadius: 6,
    shadow: '0 2px 8px rgba(0,0,0,0.2)',
  },

  typographyDefaults: {
    fontFamily: 'Inter, Helvetica, Arial, sans-serif',
    fontSize: 48,
    fontWeight: 600,
    color: '#FFFFFF',
    shadow: '0 2px 10px rgba(0,0,0,0.3)',
  },

  transitionDefaults: {
    type: 'fade',
    durationFrames: 12,
  },

  colorScheme: {
    primary: '#2C2C2E',
    secondary: '#636366',
    accent: '#007AFF',
    background: '#000000',
    text: '#FFFFFF',
    highlight: '#007AFF',
  },
};
