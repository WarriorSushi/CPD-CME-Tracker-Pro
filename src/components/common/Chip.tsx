import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { PressableFX } from './PressableFX';
import { theme } from '../../constants/theme';

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
  // Get variant-specific styles
  const variantStyles = getVariantStyles(variant);

  const chipStyle: ViewStyle[] = [
    styles.base,
    variantStyles.container,
    disabled ? styles.disabled : {},
    ...(Array.isArray(style) ? style : [style]).filter((s): s is ViewStyle => s != null),
  ].filter((s): s is ViewStyle => s != null);

  const textStyle: TextStyle[] = [
    styles.text,
    variantStyles.text,
    disabled ? styles.disabledText : {},
  ].filter((s): s is TextStyle => s != null);

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
const getVariantStyles = (variant: ChipProps['variant']) => {
  const variants = {
    default: {
      container: {
        backgroundColor: theme.colors.gray[100],
        borderWidth: 1,
        borderColor: theme.colors.border.medium,
      },
      text: {
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
      },
    },
    selected: {
      container: {
        backgroundColor: theme.colors.primary + '15', // Light blue background
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      text: {
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.medium,
      },
    },
    warning: {
      container: {
        backgroundColor: theme.colors.warning + '15', // Light warning background
        borderWidth: 1,
        borderColor: theme.colors.warning,
      },
      text: {
        color: theme.colors.warning,
        fontWeight: theme.typography.fontWeight.medium,
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