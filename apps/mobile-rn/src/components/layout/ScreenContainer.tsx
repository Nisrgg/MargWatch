import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
  ScrollViewProps,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { gradients } from '../../theme/gradients';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
}

export function ScreenContainer({
  children,
  scrollable = false,
  contentContainerStyle,
  style,
}: ScreenContainerProps) {
  const Wrapper: React.ComponentType<ScrollViewProps | any> = scrollable ? ScrollView : View;

  return (
    <LinearGradient
      colors={gradients.dashboardBackground.colors}
      start={gradients.dashboardBackground.start}
      end={gradients.dashboardBackground.end}
      style={styles.gradient}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <Wrapper
          style={[styles.content, style]}
          {...(scrollable ? { contentContainerStyle: [styles.scrollContent, contentContainerStyle] } : {})}
        >
          {children}
        </Wrapper>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
});

