import React from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

export interface PressableFXProps extends Omit<PressableProps, 'style'> {
  style?: ViewStyle | ViewStyle[];
  pressedStyle?: ViewStyle;
  ledgeHeight?: number; // Height of the bottom shadow/ledge
  pressTranslateY?: number; // How much to translate down when pressed
  pressAnimationDuration?: number;
  children: React.ReactNode;
}

export const PressableFX: React.FC<PressableFXProps> = ({
  style,
  pressedStyle,
  ledgeHeight = 0,
  pressTranslateY = 3,
  pressAnimationDuration = 150,
  children,
  onPressIn,
  onPressOut,
  ...pressableProps
}) => {
  const pressAnimation = useSharedValue(0);

  const handlePressIn = (event: any) => {
    pressAnimation.value = withTiming(1, { duration: 50 }); // Quick press
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    pressAnimation.value = withTiming(0, { duration: pressAnimationDuration });
    onPressOut?.(event);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressAnimation.value,
      [0, 1],
      [0, pressTranslateY]
    );

    const shadowOpacity = interpolate(
      pressAnimation.value,
      [0, 1],
      [1, 0]
    );

    const marginBottom = interpolate(
      pressAnimation.value,
      [0, 1],
      [ledgeHeight, 0]
    );

    return {
      transform: [{ translateY }],
      shadowOpacity: ledgeHeight > 0 ? shadowOpacity : 1,
      marginBottom: ledgeHeight > 0 ? marginBottom : 0,
    };
  });

  return (
    <Pressable
      {...pressableProps}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, animatedStyle, pressedStyle && pressAnimation.value && pressedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};