import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  interpolate,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Svg, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressCircleProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  duration?: number;
  children?: React.ReactNode;
  // Enhanced props
  showGlow?: boolean;
  gradientColors?: [string, string];
  pulseOnComplete?: boolean;
  showShadow?: boolean;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  size = 120,
  strokeWidth = 8,
  progress,
  showPercentage = true,
  color = theme.colors.primary,
  backgroundColor = theme.colors.gray[200],
  duration = 1000,
  children,
  showGlow = true,
  gradientColors = [theme.colors.primary, theme.colors.secondary],
  pulseOnComplete = true,
  showShadow = true,
}) => {
  const animatedProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration,
    });

    // Glow effect when progress changes
    if (showGlow && progress > 0) {
      glowOpacity.value = withTiming(1, { duration: 300 }, () => {
        glowOpacity.value = withTiming(0, { duration: 700 });
      });
    }

    // Pulse effect when completed
    if (pulseOnComplete && progress >= 1) {
      pulseScale.value = withSpring(1.1, {}, () => {
        pulseScale.value = withSpring(1);
      });
    }
  }, [progress, duration, showGlow, pulseOnComplete]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(
      animatedProgress.value,
      [0, 1],
      [circumference, 0]
    );

    return {
      strokeDashoffset,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const percentage = Math.round(progress * 100);

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, containerAnimatedStyle]}>
      {/* Glow effect background */}
      {showGlow && (
        <Animated.View 
          style={[
            styles.glowContainer,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              backgroundColor: `${color}15`,
            },
            glowAnimatedStyle,
          ]}
        />
      )}
      
      {/* Shadow container */}
      <View style={[
        showShadow && styles.shadowContainer,
        { width: size, height: size, borderRadius: size / 2 }
      ]}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
          
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
      </View>
      
      <View style={styles.content}>
        {children || (showPercentage && (
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageText, { color: color }]}>
              {percentage}%
            </Text>
            {progress >= 1 && (
              <Text style={styles.completeText}>Complete! 🎉</Text>
            )}
          </View>
        ))}
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
    top: -10,
    left: -10,
  },
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
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
    marginTop: 2,
    textAlign: 'center',
  },
});

export default ProgressCircle;