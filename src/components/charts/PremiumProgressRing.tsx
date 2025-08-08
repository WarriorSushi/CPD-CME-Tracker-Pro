import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface PremiumProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  duration?: number;
  children?: React.ReactNode;
  showGlow?: boolean;
  pulseOnComplete?: boolean;
}

export const PremiumProgressRing: React.FC<PremiumProgressRingProps> = ({
  size = 160,
  strokeWidth = 12,
  progress,
  color = theme.colors.primary,
  backgroundColor = theme.colors.gray.light,
  duration = 1500,
  children,
  showGlow = true,
  pulseOnComplete = true,
}) => {
  const animatedProgress = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate progress
    animatedProgress.value = withTiming(progress, {
      duration,
      easing: Easing.out(Easing.cubic),
    });

    // Glow effect when progress changes
    if (showGlow && progress > 0) {
      glowOpacity.value = withTiming(0.4, { duration: 400 }, () => {
        glowOpacity.value = withTiming(0, { duration: 800 });
      });
    }

    // Pulse effect when completed
    if (pulseOnComplete && progress >= 0.99) {
      scaleValue.value = withSpring(1.05, { damping: 15 }, () => {
        scaleValue.value = withSpring(1, { damping: 15 });
      });
    }
  }, [progress, duration, showGlow, pulseOnComplete]);

  // Simple rotation animation for progress
  const rotationStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      animatedProgress.value,
      [0, 1],
      [0, 360]
    );
    
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Animated container style
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  // Animated glow style
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const percentage = Math.round(progress * 100);

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, containerStyle]}>
      {/* Glow effect */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowContainer,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              top: -10,
              left: -10,
            },
            glowStyle,
          ]}
        >
          <LinearGradient
            colors={[color + '30', color + '10', 'transparent']}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: (size + 20) / 2,
            }}
          />
        </Animated.View>
      )}

      {/* Progress Ring */}
      <View style={styles.ringContainer}>
        {/* Background Ring */}
        <View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: backgroundColor,
            },
          ]}
        />

        {/* Simple Progress Indicator */}
        <View
          style={[
            styles.progressIndicator,
            {
              width: size - strokeWidth + 2,
              height: size - strokeWidth + 2,
              borderRadius: (size - strokeWidth + 2) / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: color,
              transform: [
                { rotate: '-90deg' },
                { 
                  rotate: `${(progress * 360)}deg`
                }
              ],
            },
          ]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {children || (
          <View style={styles.defaultContent}>
            <Text style={[styles.percentageText, { color }]}>{percentage}%</Text>
            {progress >= 0.99 && (
              <Text style={styles.completeText}>Complete! 🎉</Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
  },
  ringContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: 'transparent',
  },
  ring: {
    position: 'absolute',
  },
  progressIndicator: {
    position: 'absolute',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultContent: {
    alignItems: 'center',
  },
  percentageText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  completeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default PremiumProgressRing;