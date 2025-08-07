import React from 'react';
import { View, ViewStyle, StyleSheet, Text, TextStyle } from 'react-native';
import { useColors, useTokens } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'selected' | 'outline' | 'success';
  style?: ViewStyle | ViewStyle[];
  titleStyle?: TextStyle | TextStyle[];
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'base',
  style,
}) => {
  const getColor = useColors();
  const tokens = useTokens();

  // Get variant-specific styles
  const variantStyles = getVariantStyles(variant, getColor, tokens);

  const cardStyle: ViewStyle[] = [
    styles.base,
    variantStyles,
    ...(Array.isArray(style) ? style : [style]).filter(Boolean),
  ];

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

// Helper function to get variant-specific styles
const getVariantStyles = (variant: CardProps['variant'], getColor: any, tokens: any) => {
  const variants = {
    base: {
      backgroundColor: getColor('gray100'),
      borderWidth: 1,
      borderColor: getColor('border'),
      shadowColor: tokens.shadow.card.color,
      shadowOffset: tokens.shadow.card.offset,
      shadowOpacity: tokens.shadow.card.opacity,
      shadowRadius: tokens.shadow.card.radius,
      elevation: 2, // Android shadow
    },
    selected: {
      backgroundColor: getColor('selectedBg'),
      borderWidth: 2,
      borderColor: getColor('primary'),
      shadowColor: tokens.shadow.card.color,
      shadowOffset: tokens.shadow.card.offset,
      shadowOpacity: tokens.shadow.card.opacity * 1.5,
      shadowRadius: tokens.shadow.card.radius,
      elevation: 3, // Android shadow
    },
    outline: {
      backgroundColor: getColor('white'),
      borderWidth: 1,
      borderColor: getColor('border'),
      shadowColor: tokens.shadow.card.color,
      shadowOffset: tokens.shadow.card.offset,
      shadowOpacity: tokens.shadow.card.opacity,
      shadowRadius: tokens.shadow.card.radius,
      elevation: 2, // Android shadow
    },
    success: {
      backgroundColor: getColor('white'),
      borderWidth: 2,
      borderColor: getColor('success'),
      shadowColor: tokens.shadow.card.color,
      shadowOffset: tokens.shadow.card.offset,
      shadowOpacity: tokens.shadow.card.opacity,
      shadowRadius: tokens.shadow.card.radius,
      elevation: 2, // Android shadow
    },
  };

  return variants[variant || 'base'];
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12, // tokens.radius.card
    padding: 16, // tokens.space[4]
  },
});

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
  const getColor = useColors();
  const tokens = useTokens();

  const titleVariants = {
    base: {
      color: getColor('textPrimary'),
      fontWeight: tokens.fontWeight.medium,
    },
    selected: {
      color: getColor('primary'),
      fontWeight: tokens.fontWeight.semibold,
    },
    success: {
      color: getColor('success'),
      fontWeight: tokens.fontWeight.semibold,
    },
  };

  const titleStyle: TextStyle[] = [
    styles.title,
    titleVariants[variant],
    ...(Array.isArray(style) ? style : [style]).filter(Boolean),
  ];

  return <Text style={titleStyle}>{children}</Text>;
};

const titleStyles = StyleSheet.create({
  title: {
    fontSize: 16, // tokens.fontSize.base
    lineHeight: 20,
  },
});

// Merge title styles into main styles
const styles = StyleSheet.create({
  base: {
    borderRadius: 12, // tokens.radius.card
    padding: 16, // tokens.space[4]
  },
  title: {
    fontSize: 16, // tokens.fontSize.base
    lineHeight: 20,
  },
});