import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { spacing, borderRadius } from '../theme/spacing';
import { complaintImageSources } from '../assets/complaintImages';

interface ImagePreviewProps {
  uri: string;
  size?: number;
}

export function ImagePreview({ uri, size = 80 }: ImagePreviewProps) {
  const source: ImageSourcePropType =
    complaintImageSources[uri] ?? { uri };

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image source={source} style={[styles.image, { width: size, height: size }]} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: borderRadius.sm, overflow: 'hidden', marginRight: spacing.xs },
  image: { borderRadius: borderRadius.sm },
});
