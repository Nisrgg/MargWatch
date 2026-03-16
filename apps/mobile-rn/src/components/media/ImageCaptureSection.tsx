import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ImageStrip } from './ImageStrip';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface ImageCaptureSectionProps {
  imageUris: string[];
  maxImages: number;
  onOpenCamera: () => void;
  onOpenGallery: () => void;
  onRemoveImage: (index: number) => void;
}

export function ImageCaptureSection({
  imageUris,
  maxImages,
  onOpenCamera,
  onOpenGallery,
  onRemoveImage,
}: ImageCaptureSectionProps) {
  return (
    <View>
      <Text style={styles.sectionLabel}>Photos (required)</Text>
      <View style={styles.imageRow}>
        <TouchableOpacity style={styles.addImageBtn} onPress={onOpenCamera}>
          <Text style={styles.addImageText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addImageBtn} onPress={onOpenGallery}>
          <Text style={styles.addImageText}>Gallery</Text>
        </TouchableOpacity>
      </View>
      {imageUris.length > 0 && (
        <ImageStrip
          uris={imageUris}
        />
      )}
      <Text style={styles.hint}>
        {imageUris.length} / {maxImages} photos. At least 1 required.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.titleSmall,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  imageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addImageBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.md,
  },
  addImageText: {
    ...typography.labelLarge,
    color: colors.onPrimaryContainer,
  },
  hint: {
    ...typography.bodySmall,
    color: colors.outline,
    marginBottom: spacing.lg,
  },
});

