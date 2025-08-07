import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { ButtonProps } from '../../types';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  ...props
}) => {
  const pressAnimation = useSharedValue(0);

  const handlePressIn = () => {
    // Instant press animation - no duration
    pressAnimation.value = withTiming(1, {
      duration: 50, // Very fast, almost instant
    });
  };

  const handlePressOut = () => {
    // Quick release animation
    pressAnimation.value = withTiming(0, {
      duration: 150, // Quick but smooth release
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    // All button variants: 5px bottom border → 0px on press
    const borderBottomWidth = interpolate(pressAnimation.value, [0, 1], [5, 0]);
    
    // Slight transform to simulate the pressed effect
    const translateY = interpolate(pressAnimation.value, [0, 1], [0, 2]);

    return {
      borderBottomWidth,
      transform: [{ translateY }],
    };
  });

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      borderRadius: theme.borderRadius.base,
    };

    // Add 5px bottom border for all buttons
    Object.assign(baseStyle, styles.primaryButton);

    // Size variations
    switch (size) {
      case 'small':
        baseStyle.height = theme.layout.buttonHeight - 8;
        baseStyle.paddingHorizontal = theme.spacing[4];
        break;
      case 'large':
        baseStyle.height = theme.layout.buttonHeight + 8;
        baseStyle.paddingHorizontal = theme.spacing[8];
        break;
      default: // medium
        baseStyle.height = theme.layout.buttonHeight;
        baseStyle.paddingHorizontal = theme.spacing[6];
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = theme.colors.button.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = theme.colors.button.primary;
        // Override bottom border color for outline
        baseStyle.borderBottomColor = theme.colors.button.primary;
        break;
      default: // primary
        baseStyle.backgroundColor = theme.colors.button.primary;
    }

    // Disabled state
    if (disabled) {
      baseStyle.backgroundColor = theme.colors.button.disabled;
      baseStyle.borderColor = theme.colors.button.disabled;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: theme.typography.fontWeight.semibold,
      textAlign: 'center',
    };

    // Size variations
    switch (size) {
      case 'small':
        baseStyle.fontSize = theme.typography.fontSize.sm;
        break;
      case 'large':
        baseStyle.fontSize = theme.typography.fontSize.lg;
        break;
      default: // medium
        baseStyle.fontSize = theme.typography.fontSize.base;
    }

    // Variant text colors
    switch (variant) {
      case 'secondary':
        baseStyle.color = theme.colors.button.textSecondary;
        break;
      case 'outline':
        baseStyle.color = disabled 
          ? theme.colors.button.textDisabled 
          : theme.colors.button.primary;
        break;
      default: // primary
        baseStyle.color = theme.colors.button.text;
    }

    // Disabled text color
    if (disabled) {
      baseStyle.color = theme.colors.button.textDisabled;
    }

    return baseStyle;
  };

  return (
    <AnimatedTouchableOpacity
      style={[getButtonStyle(), animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? theme.colors.white : theme.colors.button.primary} 
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    // 5px bottom border for primary/secondary buttons
    borderBottomWidth: 5,
    borderBottomColor: '#4B5563',
  },
});

export default Button;