import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface SimpleProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  duration?: number;
  children?: React.ReactNode;
}

export const SimpleProgressRing: React.FC<SimpleProgressRingProps> = ({
  size = 160,
  strokeWidth = 12,
  progress,
  color = theme.colors.primary,
  backgroundColor = theme.colors.gray.light,
  duration = 1500,
  children,
}) => {
  const scaleValue = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Glow effect when progress changes
    if (progress > 0) {
      glowOpacity.value = withTiming(0.3, { duration: 400 }, () => {
        glowOpacity.value = withTiming(0, { duration: 800 });
      });
    }

    // Pulse effect when completed
    if (progress >= 0.99) {
      scaleValue.value = withSpring(1.05, { damping: 15 }, () => {
        scaleValue.value = withSpring(1, { damping: 15 });
      });
    }
  }, [progress]);

  // Animated container style
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  // Animated glow style
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const percentage = Math.round(progress * 100);
  
  // Create progress segments starting from 12 o'clock (top) going clockwise
  const createSegments = () => {
    const segments = [];
    const totalSegments = 80; // More segments for smoother appearance
    const filledSegments = Math.floor(progress * totalSegments);
    
    for (let i = 0; i < totalSegments; i++) {
      const angle = (i * 360) / totalSegments; // Start from 12 o'clock (0 degrees), go clockwise
      const isActive = i < filledSegments;
      const radius = size / 2 - strokeWidth / 2;
      
      segments.push(
        <View
          key={i}
          style={[
            styles.segment,
            {
              position: 'absolute',
              width: 4.5, // Slightly wider to reduce gaps
              height: strokeWidth,
              backgroundColor: isActive ? color : backgroundColor,
              borderRadius: 2,
              transform: [
                { rotate: `${angle}deg` },
                { translateY: -radius },
              ],
            },
          ]}
        />
      );
    }
    
    return segments;
  };

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, containerStyle]}>
      {/* Glow effect */}
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

      {/* Progress Ring Container */}
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        {/* Shadow */}
        <View style={styles.shadow} />
        
        {/* Perfect circular background to hide artifacts */}
        <View
          style={[
            styles.circularBackground,
            {
              width: size - strokeWidth * 2,
              height: size - strokeWidth * 2,
              borderRadius: (size - strokeWidth * 2) / 2,
            },
          ]}
        />
        
        {/* Segments */}
        <View style={styles.segmentsContainer}>
          {createSegments()}
        </View>
      </View>

      {/* Content */}
      <View 
        style={styles.content}
        accessible={true}
        accessibilityLabel={`Progress: ${percentage}% complete`}
        accessibilityHint="Annual CME requirement progress"
        accessibilityRole="progressbar"
      >
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
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
  circularBackground: {
    position: 'absolute',
    backgroundColor: '#FFF5EE', // Match the dashboard background
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentsContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segment: {
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

export default SimpleProgressRing;