import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, KeyboardAvoidingView, Platform, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { AnimatedGradientBackground } from '../common/OnboardingComponents';
import { StandardHeader } from '../common/StandardHeader';
import { theme } from '../../constants/theme';

export interface FormContainerProps {
  /**
   * Form title shown in header
   */
  title: string;

  /**
   * Enable back navigation
   */
  showBackButton?: boolean;

  /**
   * Custom header action (e.g., save button)
   */
  headerAction?: React.ReactNode;

  /**
   * Form content
   */
  children: React.ReactNode;

  /**
   * Enable gradient background (premium style)
   */
  gradientBackground?: boolean;

  /**
   * Enable entrance animations
   */
  animated?: boolean;

  /**
   * Animation delay in ms (useful for staggering multiple elements)
   */
  animationDelay?: number;

  /**
   * Custom footer content (e.g., submit buttons)
   */
  footer?: React.ReactNode;

  /**
   * Scroll view content container style
   */
  contentContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Callback when back button pressed
   */
  onBackPress?: () => void;
}

/**
 * FormContainer - Common wrapper for form screens
 *
 * Features:
 * - Gradient background option
 * - Entrance animations
 * - Standard header with back button
 * - Keyboard avoiding
 * - Safe area handling
 * - Footer support for action buttons
 */
export const FormContainer: React.FC<FormContainerProps> = ({
  title,
  showBackButton = true,
  headerAction,
  children,
  gradientBackground = false,
  animated = true,
  animationDelay = 0,
  footer,
  contentContainerStyle,
  onBackPress,
}) => {
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  useFocusEffect(
    useCallback(() => {
      if (!animated) {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
        contentAnim.setValue(1);
        return;
      }

      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      contentAnim.setValue(0);

      // Run entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          delay: animationDelay,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 30,
          friction: 8,
          delay: animationDelay,
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered content animation
      Animated.sequence([
        Animated.delay(animationDelay + 150),
        Animated.spring(contentAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, [animated, animationDelay, fadeAnim, slideAnim, contentAnim])
  );

  const containerContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.headerContainer,
            animated && {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <StandardHeader
            title={title}
            showBackButton={showBackButton}
            onBackPress={onBackPress}
            rightAction={headerAction}
          />
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            animated && {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>

        {/* Footer */}
        {footer && (
          <View
            style={[
              styles.footer,
              {
                paddingBottom: insets.bottom || theme.spacing[4],
              },
            ]}
          >
            {footer}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );

  if (gradientBackground) {
    return (
      <AnimatedGradientBackground>
        {containerContent}
      </AnimatedGradientBackground>
    );
  }

  return <View style={styles.plainBackground}>{containerContent}</View>;
};

const styles = StyleSheet.create({
  plainBackground: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[4],
  },
  footer: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});
