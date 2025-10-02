import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  thickness?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  color,
  thickness = 2,
}) => {
  // Use theme color as default, but evaluate inside component to avoid module load-time issues
  const spinnerColor = color || theme.colors.primary;
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
      }),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotation.value}deg`,
        },
      ],
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderWidth: thickness,
            borderTopColor: spinnerColor,
            borderRightColor: spinnerColor,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            borderRadius: size / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    // borderRadius is set inline in the component
  },
});

export default LoadingSpinner;