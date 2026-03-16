import React from 'react';
import { FlatList, FlatListProps, StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';

export function HorizontalList<ItemT>(props: FlatListProps<ItemT>) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      {...props}
      contentContainerStyle={[styles.content, props.contentContainerStyle]}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
  },
});

