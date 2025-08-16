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
  withSpring,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { ButtonProps } from '../../types';
import { HapticsUtils } from '../../utils/HapticsUtils';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}) => {
  const pressAnimation = useSharedValue(0);

  const handlePressIn = () => {
    if (!disabled) { // No animation for disabled buttons
      // Add haptic feedback based on button variant
      switch (variant) {
        case 'destructive':
          HapticsUtils.warning();
          break;
        case 'primary':
          HapticsUtils.medium();
          break;
        case 'outline':
          HapticsUtils.light();
          break;
        default:
          HapticsUtils.light();
          break;
      }
      
      pressAnimation.value = withTiming(1, { 
        duration: 100, 
        easing: Easing.out(Easing.quad) 
      });
    }
  };

  const handlePressOut = () => {
    if (!disabled) { // No animation for disabled buttons
      pressAnimation.value = withSpring(0, {
        damping: 12,
        stiffness: 200,
        mass: 0.8,
      });
    }
  };

  // Pre-calculate colors outside animation context
  const colors = {
    primary: theme.colors.primary,
    primaryDark: theme.colors.primaryDark,
    primaryDisabled: theme.colors.button.disabled,
    gray100: theme.colors.gray[100],
    gray300: theme.colors.gray[300],
    gray400: theme.colors.gray[400],
    error: theme.colors.error,
    errorDisabled: theme.colors.button.disabled,
    white: theme.colors.white,
  };

  // Enhanced tactile animation with color interpolation and reduced travel
  const animatedStyle = useAnimatedStyle(() => {
    // Skip animations entirely for disabled buttons
    if (disabled) {
      return {};
    }
    
    const ledgeHeight = variant === 'outline' ? 5 : 5; // All buttons get 5px ledge
    const travelDistance = ledgeHeight * 0.8; // Reduced travel distance
    
    // Position with bounce-back overtravel
    const translateY = interpolate(
      pressAnimation.value, 
      [0, 1], 
      [-1, travelDistance] // Start slightly above resting, travel down with overtravel
    );
    
    // Ledge shadow (border-bottom) disappears on press
    const borderBottomWidth = interpolate(pressAnimation.value, [0, 1], [ledgeHeight, 0]);
    
    // Shadow fades faster than movement for depth illusion
    const shadowOpacity = interpolate(pressAnimation.value, [0, 0.6, 1], [0.1, 0.05, 0]);
    
    // Color interpolation based on variant
    let backgroundColor, borderColor;
    
    switch (variant) {
      case 'primary':
        backgroundColor = interpolateColor(
          pressAnimation.value,
          [0, 1],
          [colors.primary, colors.primaryDark]
        );
        break;
        
      case 'outline':
        backgroundColor = interpolateColor(
          pressAnimation.value,
          [0, 1],
          ['transparent', colors.gray100]
        );
        borderColor = interpolateColor(
          pressAnimation.value,
          [0, 1],
          [colors.gray400, colors.gray400] // Keep darker ledge color consistent
        );
        break;
        
      case 'destructive':
        backgroundColor = interpolateColor(
          pressAnimation.value,
          [0, 1],
          [colors.error, colors.error] 
        );
        break;
        
      default:
        backgroundColor = colors.primary;
        break;
    }
    
    return {
      borderBottomWidth,
      transform: [{ translateY }],
      shadowOpacity,
      backgroundColor,
      ...(borderColor && { borderColor }),
    };
  });

  const getBaseStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.small,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: theme.spacing[5],
    };

    // Add shadow/elevation for non-outline buttons
    if (variant !== 'outline') {
      baseStyle.shadowColor = '#000';
      baseStyle.shadowOffset = { width: 0, height: 4 };
      baseStyle.shadowRadius = 0;
      baseStyle.elevation = 4;
      
      // Disabled buttons get faint flat shadow, no ledge
      if (disabled) {
        baseStyle.shadowOpacity = 0.05; // Faint shadow
      } else {
        baseStyle.shadowOpacity = 0.1; // Normal shadow
      }
    }

    // Size variations
    if (size === 'small') {
      baseStyle.minHeight = 40;
      baseStyle.paddingHorizontal = theme.spacing[3];
    } else if (size === 'large') {
      baseStyle.minHeight = 56;
      baseStyle.paddingHorizontal = theme.spacing[6];
    }

    return baseStyle;
  };

  const getVariantStyle = (): ViewStyle & TextStyle => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? theme.colors.gray[200] : theme.colors.gray[300],
          borderWidth: 1,
          borderBottomWidth: disabled ? 1 : 6, // Remove ledge when disabled
          borderBottomColor: disabled ? theme.colors.gray[200] : theme.colors.gray[400],
          color: disabled ? theme.colors.text.disabled : theme.colors.text.primary,
        };
      case 'destructive':
        return {
          backgroundColor: disabled ? colors.errorDisabled : colors.error,
          borderBottomWidth: disabled ? 0 : 5, // Remove ledge when disabled
          borderBottomColor: disabled ? 'transparent' : colors.error,
          color: disabled ? `rgba(255, 255, 255, 0.85)` : colors.white, // 85% white opacity for disabled
        };
      default: // primary
        return {
          backgroundColor: disabled ? colors.primaryDisabled : colors.primary,
          borderBottomWidth: disabled ? 0 : 5, // Remove ledge when disabled
          borderBottomColor: disabled ? 'transparent' : colors.primaryDark,
          color: disabled ? `rgba(255, 255, 255, 0.85)` : colors.white, // 85% white opacity for disabled
        };
    }
  };

  const baseStyle = getBaseStyle();
  const variantStyle = getVariantStyle();

  const buttonStyle: ViewStyle[] = [
    styles.button,
    baseStyle,
    variantStyle,
    // Removed disabled opacity fade - using proper disabled colors instead
    ...(Array.isArray(style) ? style : [style]).filter(Boolean),
  ];

  const textStyle = [
    styles.text,
    { color: variantStyle.color },
    // Color is now handled in getVariantStyle for disabled state
  ];

  return (
    <AnimatedTouchableOpacity
      style={[buttonStyle, animatedStyle]}
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.color as string} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // Base button styles handled by getBaseStyle
  },
  text: {
    fontSize: 16, // tokens.fontSize.base
    fontWeight: '600', // tokens.fontWeight.semibold
    textAlign: 'center',
  },
  // Removed opacity-based disabled styling - using proper HSL colors instead
});