import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { PressableFX } from './PressableFX';
import { useColors, useTokens } from '../../theme';

export interface ChipProps {
  label: string;
  variant?: 'default' | 'selected' | 'warning';
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'default',
  onPress,
  disabled = false,
  style,
}) => {
  const getColor = useColors();
  const tokens = useTokens();

  // Get variant-specific styles
  const variantStyles = getVariantStyles(variant, getColor, tokens);

  const chipStyle: ViewStyle[] = [
    styles.base,
    variantStyles.container,
    disabled && styles.disabled,
    ...(Array.isArray(style) ? style : [style]).filter(Boolean),
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    variantStyles.text,
    disabled && styles.disabledText,
  ];

  // If no onPress, render as static view
  if (!onPress) {
    return (
      <View style={chipStyle}>
        <Text style={textStyle}>{label}</Text>
      </View>
    );
  }

  // Otherwise render as pressable
  return (
    <PressableFX
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      ledgeHeight={0} // Chips don't have ledge effect
      pressTranslateY={1} // Subtle press effect
      pressAnimationDuration={100}
      style={chipStyle}
    >
      <Text style={textStyle}>{label}</Text>
    </PressableFX>
  );
};

// Helper function to get variant-specific styles
const getVariantStyles = (variant: ChipProps['variant'], getColor: any, tokens: any) => {
  const variants = {
    default: {
      container: {
        backgroundColor: getColor('gray100'),
        borderWidth: 1,
        borderColor: getColor('border'),
      },
      text: {
        color: getColor('textPrimary'),
        fontWeight: tokens.fontWeight.medium,
      },
    },
    selected: {
      container: {
        backgroundColor: getColor('selectedBg'),
        borderWidth: 1,
        borderColor: getColor('primary'),
      },
      text: {
        color: getColor('primary'),
        fontWeight: tokens.fontWeight.medium,
      },
    },
    warning: {
      container: {
        backgroundColor: getColor('warningBg'),
        borderWidth: 1,
        borderColor: getColor('warningBorder'),
      },
      text: {
        color: getColor('warningText'),
        fontWeight: tokens.fontWeight.medium,
      },
    },
  };

  return variants[variant || 'default'];
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999, // tokens.radius.chip - fully rounded
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  text: {
    fontSize: 14, // tokens.fontSize.sm
    lineHeight: 16,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

// Need to import View for the non-pressable case
import { View } from 'react-native';