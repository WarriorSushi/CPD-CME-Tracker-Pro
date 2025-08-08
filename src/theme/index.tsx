import React, { createContext, useContext, ReactNode, useState } from 'react';
import { tokens, ColorToken } from './tokens';

// Global semantic mapping - single source of truth for color usage
export const appTheme = {
  // Layout
  background: 'white' as ColorToken,
  surface: 'gray50' as ColorToken,
  
  // Text
  textPrimary: 'gray900' as ColorToken,
  textSecondary: 'gray500' as ColorToken,
  textDisabled: 'gray400' as ColorToken,
  textInverse: 'white' as ColorToken,
  
  // Borders
  borderLight: 'gray200' as ColorToken,
  border: 'gray300' as ColorToken,
  borderDark: 'gray400' as ColorToken,
  
  // Interactive states
  selectedBg: 'selectedBg' as ColorToken,
  
  // Semantic colors
  success: 'success' as ColorToken,
  warningBg: 'warningBg' as ColorToken,
  warningBorder: 'warningBorder' as ColorToken,
  warningText: 'warningText' as ColorToken,
  error: 'error' as ColorToken,
  info: 'info' as ColorToken,
  
  // Brand colors
  primary: 'primary' as ColorToken,
  primaryDark: 'primaryDark' as ColorToken,
  primaryLight: 'primaryLight' as ColorToken,
};

// Theme mode type (prepared for dark mode later)
export type ThemeMode = 'light' | 'dark';

// Theme context
interface ThemeContextValue {
  mode: ThemeMode;
  tokens: typeof tokens;
  colors: typeof appTheme;
  getColor: (colorName: ColorToken | keyof typeof appTheme) => string;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Color utility function
export const getColor = (colorName: ColorToken | keyof typeof appTheme): string => {
  // First check if it's a semantic color in appTheme
  if (colorName in appTheme) {
    const tokenName = appTheme[colorName as keyof typeof appTheme] as ColorToken;
    return tokens.color[tokenName];
  }
  
  // Otherwise treat it as a direct token
  if (colorName in tokens.color) {
    return tokens.color[colorName as ColorToken];
  }
  
  console.warn(`Color token '${String(colorName)}' not found`);
  return tokens.color.gray500; // fallback
};

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialMode = 'light' 
}) => {
  const [mode, setMode] = React.useState<ThemeMode>(initialMode);

  const contextValue: ThemeContextValue = {
    mode,
    tokens,
    colors: appTheme,
    getColor,
    setMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme hook
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hooks for specific theme aspects
export const useColors = () => {
  const { getColor } = useTheme();
  return getColor;
};

export const useTokens = () => {
  const { tokens } = useTheme();
  return tokens;
};

// Export tokens and utilities for direct usage
export { tokens } from './tokens';
export type { ColorToken } from './tokens';

// Legacy support - maps old theme structure to new tokens
export const legacyTheme = {
  colors: {
    // Primary colors
    primary: getColor('primary'),
    primaryDark: getColor('primaryDark'),
    primaryLight: getColor('primaryLight'),
    
    // Base colors
    white: getColor('white'),
    black: getColor('black'),
    background: getColor('background'),
    surface: getColor('surface'),
    
    // Text colors
    text: {
      primary: getColor('textPrimary'),
      secondary: getColor('textSecondary'),
      disabled: getColor('textDisabled'),
      inverse: getColor('textInverse'),
    },
    
    // Border colors
    border: {
      light: getColor('borderLight'),
      medium: getColor('border'),
      dark: getColor('borderDark'),
    },
    
    // Semantic colors
    success: getColor('success'),
    warning: getColor('warningBorder'),
    error: getColor('error'),
    info: getColor('info'),
  },
  
  // Spacing (unchanged)
  spacing: tokens.space,
  
  // Typography
  typography: {
    fontSize: tokens.fontSize,
    fontWeight: tokens.fontWeight,
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    }
  },
  
  // Border radius
  borderRadius: {
    small: tokens.radius.small,
    medium: tokens.radius.medium,
    large: tokens.radius.large,
  },
};