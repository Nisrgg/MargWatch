import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';

interface MWScrollProps extends ScrollViewProps {
  children: React.ReactNode;
}

export function MWScroll({ children, contentContainerStyle, ...rest }: MWScrollProps) {
  return (
    <ScrollView
      {...rest}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});

