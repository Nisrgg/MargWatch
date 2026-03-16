import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../theme/spacing';

interface ImagePreviewProps {
  uri: string;
  size?: number;
}

export function ImagePreview({ uri, size = 80 }: ImagePreviewProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image source={{ uri }} style={[styles.image, { width: size, height: size }]} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: borderRadius.sm, overflow: 'hidden', marginRight: spacing.xs },
  image: { borderRadius: borderRadius.sm },
});
