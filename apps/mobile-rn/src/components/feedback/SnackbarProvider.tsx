import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type SnackbarVariant = 'success' | 'error' | 'info';

interface SnackbarState {
  visible: boolean;
  message: string;
  variant: SnackbarVariant;
}

interface SnackbarContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    visible: false,
    message: '',
    variant: 'info',
  });

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const show = useCallback((message: string, variant: SnackbarVariant) => {
    setState({ visible: true, message, variant });
    setTimeout(hide, 2500);
  }, [hide]);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showSuccess: (m) => show(m, 'success'),
      showError: (m) => show(m, 'error'),
      showInfo: (m) => show(m, 'info'),
    }),
    [show],
  );

  const backgroundColor =
    state.variant === 'success'
      ? colors.success
      : state.variant === 'error'
      ? colors.error
      : colors.primary;

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {state.visible && (
        <View style={styles.container} pointerEvents="none">
          <View style={[styles.snackbar, { backgroundColor }]}>
            <Text style={styles.text}>{state.message}</Text>
          </View>
        </View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
    alignItems: 'center',
  },
  snackbar: {
    maxWidth: '90%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    elevation: 4,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.onPrimary,
  },
});

