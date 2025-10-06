import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp, GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';

export interface PressableFXProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
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

  const handlePressIn = (event: GestureResponderEvent) => {
    pressAnimation.value = withTiming(1, { 
      duration: 100, 
      easing: Easing.out(Easing.quad) 
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    pressAnimation.value = withSpring(0, {
      damping: 12,
      stiffness: 200,
      mass: 0.8,
    });
    onPressOut?.(event);
  };

  const animatedStyle = useAnimatedStyle(() => {
    // Enhanced overtravel with bounce-back
    const travelDistance = pressTranslateY * 1.2; // 1.2x overtravel
    const translateY = interpolate(
      pressAnimation.value,
      [0, 1],
      [-1, travelDistance] // Start slightly above, travel with overtravel
    );

    // Shadow fades faster than movement for depth illusion
    const shadowOpacity = interpolate(
      pressAnimation.value,
      [0, 0.6, 1],
      [1, 0.3, 0]
    );

    // Ledge shadow (margin) shrinks on press
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
      <Animated.View
        style={[style, animatedStyle, pressedStyle && pressAnimation.value > 0 ? pressedStyle : undefined]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};


