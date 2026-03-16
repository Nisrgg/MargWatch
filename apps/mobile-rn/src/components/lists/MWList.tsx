import React from 'react';
import { FlatList, FlatListProps, StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';

export function MWList<ItemT>(props: FlatListProps<ItemT>) {
  return (
    <FlatList
      {...props}
      contentContainerStyle={[styles.content, props.contentContainerStyle]}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});

