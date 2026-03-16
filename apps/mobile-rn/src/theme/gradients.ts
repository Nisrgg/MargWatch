import { colors } from './colors';

/**
 * App-wide gradient tokens derived from the Compose design system.
 * These are used by layout primitives (e.g. ScreenContainer) and
 * gradient-style buttons or cards.
 */
export const gradients = {
  /** Dashboard-style background gradient */
  dashboardBackground: {
    colors: [colors.primaryContainer, colors.background],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  /** Accent background for key screens that need more contrast */
  accentBackground: {
    colors: [colors.primary, colors.secondary],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  /** Generic gradient button token */
  button: {
    colors: [colors.primary, colors.secondary],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
};

export type AppGradients = typeof gradients;

