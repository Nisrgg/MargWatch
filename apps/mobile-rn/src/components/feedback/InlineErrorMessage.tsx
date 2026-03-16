import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface InlineErrorMessageProps {
  message: string;
}

export function InlineErrorMessage({ message }: InlineErrorMessageProps) {
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    ...typography.bodyMedium,
    color: colors.error,
  },
});

