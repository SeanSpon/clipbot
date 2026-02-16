/**
 * Reusable Remotion spring configuration objects.
 * Pass these as the `config` option to `spring()`.
 */

export const springConfigs = {
  /** High bounce, snappy feel — kinetic slams, bounces */
  bouncy: {
    damping: 8,
    mass: 0.6,
    stiffness: 200,
    overshootClamping: false,
  },

  /** Gentle, polished motion — zoom pushes, fades */
  smooth: {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
  },

  /** Quick and decisive — quick cuts, snappy text */
  snappy: {
    damping: 14,
    mass: 0.4,
    stiffness: 300,
    overshootClamping: false,
  },

  /** Slow and deliberate — dramatic reveals */
  slow: {
    damping: 30,
    mass: 1.5,
    stiffness: 60,
    overshootClamping: false,
  },

  /** No overshoot, clean stop */
  critical: {
    damping: 18,
    mass: 1,
    stiffness: 150,
    overshootClamping: true,
  },
} as const;

export type SpringConfigName = keyof typeof springConfigs;
