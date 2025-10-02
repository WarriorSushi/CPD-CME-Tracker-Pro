import React from 'react';
import { View, ViewStyle, StyleSheet, Text, TextStyle } from 'react-native';
import { theme } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'selected' | 'outline' | 'success' | 'entry';
  style?: ViewStyle | ViewStyle[];
  titleStyle?: TextStyle | TextStyle[];
}

export const Card = React.memo<CardProps>(({
  children,
  variant = 'base',
  style,
}) => {
  // Get variant-specific styles
  const variantStyles = getVariantStyles(variant);

  const cardStyle: ViewStyle[] = [
    styles.base,
    variantStyles,
    ...(Array.isArray(style) ? style : [style]).filter((s): s is ViewStyle => s != null),
  ].filter((s): s is ViewStyle => s != null);

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
});

// Helper function to get variant-specific styles
const getVariantStyles = (variant: CardProps['variant']) => {
  const variants = {
    base: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.small,
    },
    selected: {
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      ...theme.shadows.medium,
    },
    outline: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.small,
    },
    success: {
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.success,
      ...theme.shadows.small,
    },
    entry: {
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.small,
    },
  };

  return variants[variant || 'base'];
};

// Export a specialized CardTitle component for consistent title styling
export interface CardTitleProps {
  children: React.ReactNode;
  variant?: 'base' | 'selected' | 'success';
  style?: TextStyle | TextStyle[];
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  variant = 'base',
  style,
}) => {
  const titleVariants = {
    base: {
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    selected: {
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    success: {
      color: theme.colors.success,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  };

  const titleStyle: TextStyle[] = [
    styles.title,
    titleVariants[variant],
    ...(Array.isArray(style) ? style : [style]).filter((s): s is TextStyle => s != null),
  ].filter((s): s is TextStyle => s != null);

  return <Text style={titleStyle}>{children}</Text>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 5, // theme.borderRadius.base - Standardized to 5px
    padding: 16, // theme.spacing[4] - List item card padding (16px)
  },
  title: {
    fontSize: 16, // tokens.fontSize.base
    lineHeight: 20,
  },
});