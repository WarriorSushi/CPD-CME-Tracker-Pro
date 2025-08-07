import React from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { PressableFX } from './PressableFX';
import { useColors, useTokens } from '../../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}) => {
  const getColor = useColors();
  const tokens = useTokens();

  // Get variant-specific styles
  const variantStyles = getVariantStyles(variant, getColor, tokens);
  const sizeStyles = getSizeStyles(size, tokens);
  
  // Get ledge height and press distance based on variant
  const ledgeHeight = variant === 'primary' ? 5 : 2;
  const pressTranslateY = variant === 'primary' ? 3 : 1;

  const buttonStyle: ViewStyle[] = [
    styles.base,
    variantStyles.container,
    sizeStyles.container,
    disabled && styles.disabled,
    ...(Array.isArray(style) ? style : [style]).filter(Boolean),
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    variantStyles.text,
    sizeStyles.text,
    disabled && styles.disabledText,
  ];

  return (
    <PressableFX
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      ledgeHeight={ledgeHeight}
      pressTranslateY={pressTranslateY}
      style={buttonStyle}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantStyles.text.color} 
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </PressableFX>
  );
};

// Helper function to get variant-specific styles
const getVariantStyles = (variant: ButtonProps['variant'], getColor: any, tokens: any) => {
  const variants = {
    primary: {
      container: {
        backgroundColor: getColor('primary'),
        borderWidth: 0,
        shadowColor: getColor('primaryDark'),
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      text: {
        color: getColor('white'),
        fontWeight: tokens.fontWeight.semibold,
      },
    },
    outline: {
      container: {
        backgroundColor: getColor('white'),
        borderWidth: 1,
        borderColor: getColor('border'),
        shadowColor: getColor('border'),
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      text: {
        color: getColor('textPrimary'),
        fontWeight: tokens.fontWeight.medium,
      },
    },
    destructive: {
      container: {
        backgroundColor: getColor('white'),
        borderWidth: 2,
        borderColor: getColor('error'),
        shadowColor: getColor('error'),
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 0,
      },
      text: {
        color: getColor('error'),
        fontWeight: tokens.fontWeight.semibold,
      },
    },
  };

  return variants[variant || 'primary'];
};

// Helper function to get size-specific styles
const getSizeStyles = (size: ButtonProps['size'], tokens: any) => {
  const sizes = {
    sm: {
      container: {
        paddingVertical: tokens.space[2],
        paddingHorizontal: tokens.space[4],
        minHeight: 36,
      },
      text: {
        fontSize: tokens.fontSize.sm,
      },
    },
    md: {
      container: {
        paddingVertical: tokens.space[3],
        paddingHorizontal: tokens.space[5],
        minHeight: 44,
      },
      text: {
        fontSize: tokens.fontSize.base,
      },
    },
    lg: {
      container: {
        paddingVertical: tokens.space[4],
        paddingHorizontal: tokens.space[6],
        minHeight: 52,
      },
      text: {
        fontSize: tokens.fontSize.lg,
      },
    },
  };

  return sizes[size || 'md'];
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 5, // tokens.radius.button
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
    lineHeight: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});