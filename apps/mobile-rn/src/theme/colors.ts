/**
 * Material Design 3 inspired color palette for MargWatch.
 * Provides consistent, accessible colors and semantic roles.
 */
export const colors = {
  // Primary — brand / key actions
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',

  // Secondary
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',

  // Tertiary
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',

  // Surface & background
  surface: '#FEF7FF',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  background: '#FEF7FF',
  onBackground: '#1C1B1F',

  // Outline
  outline: '#79747E',
  outlineVariant: '#CAC4D0',

  // Error
  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',

  // Success (semantic)
  success: '#2E7D32',
  onSuccess: '#FFFFFF',

  // Role-based accents (user / worker / admin)
  roleUser: '#1E88E5',
  onRoleUser: '#FFFFFF',
  roleWorker: '#FB8C00',
  onRoleWorker: '#FFFFFF',
  roleAdmin: '#7B1FA2',
  onRoleAdmin: '#FFFFFF',

  // Status chips (complaint / work order)
  statusRegistered: '#1E88E5',
  statusApproved: '#43A047',
  statusProcessing: '#FB8C00',
  statusPendingReview: '#7B1FA2',
  statusCompleted: '#2E7D32',
  statusRejected: '#C62828',

  // Card & elevation
  card: '#FFFFFF',
  cardBorder: '#E7E0EC',
  shadow: '#000000',
};

export type ColorScheme = typeof colors;
