import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ImagePreview } from '../ImagePreview';
import { spacing } from '../../theme/spacing';

interface ImageStripProps {
  uris: string[];
}

export function ImageStrip({ uris }: ImageStripProps) {
  if (!uris.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {uris.map((uri) => (
        <ImagePreview key={uri} uri={uri} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  content: {
    paddingRight: spacing.md,
  },
});

