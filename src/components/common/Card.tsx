import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'small' | 'medium' | 'large';
  pressable?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'small',
  pressable = false,
  onPress,
}) => {
  const scaleValue = useSharedValue(1);

  const handlePressIn = () => {
    if (pressable) {
      scaleValue.value = withSpring(0.98, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scaleValue.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.base,
      padding: theme.layout.cardPadding,
    };

    // Apply elevation shadows
    let shadowStyle;
    switch (elevation) {
      case 'medium':
        shadowStyle = theme.shadows.medium;
        break;
      case 'large':
        shadowStyle = theme.shadows.large;
        break;
      default: // small
        shadowStyle = theme.shadows.small;
    }

    // Apply shadow properties individually
    baseStyle.shadowColor = shadowStyle.shadowColor;
    baseStyle.shadowOffset = shadowStyle.shadowOffset;
    baseStyle.shadowOpacity = shadowStyle.shadowOpacity;
    baseStyle.shadowRadius = shadowStyle.shadowRadius;
    baseStyle.elevation = shadowStyle.elevation;

    return baseStyle;
  };

  const CardComponent = pressable ? Animated.Pressable : Animated.View;

  return (
    <CardComponent
      style={[getCardStyle(), animatedStyle, style]}
      onPressIn={pressable ? handlePressIn : undefined}
      onPressOut={pressable ? handlePressOut : undefined}
      onPress={pressable ? onPress : undefined}
    >
      {children}
    </CardComponent>
  );
};

export default Card;