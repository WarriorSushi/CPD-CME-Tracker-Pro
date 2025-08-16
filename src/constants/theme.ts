// LEGACY: Theme constants for CME Tracker - MIGRATE TO NEW THEME SYSTEM
// This is maintained for backward compatibility during migration

import { tokens } from '../theme/tokens';

export const theme = {
  colors: {
    // Primary colors - now using HSL tokens
    primary: tokens.color.primary,        // 'hsl(212 100% 40%)'
    primaryDark: tokens.color.primaryDark, // 'hsl(212 100% 30%)'
    primaryLight: tokens.color.primaryLight, // 'hsl(212 60% 55%)'
    
    // Secondary colors
    secondary: tokens.color.success,      // 'hsl(158 64% 52%)'
    secondaryDark: 'hsl(158 64% 42%)',   // Darker version
    secondaryLight: 'hsl(158 64% 62%)',  // Lighter version
    
    // Base colors
    white: tokens.color.white,           // 'hsl(0 0% 100%)'
    black: tokens.color.black,           // 'hsl(0 0% 0%)'
    
    // Gray scale - using new HSL tokens
    gray: {
      50: tokens.color.gray50,   // 'hsl(210 20% 98%)'
      100: tokens.color.gray100, // 'hsl(210 20% 96%)'
      200: tokens.color.gray200, // 'hsl(214 20% 89%)'
      300: tokens.color.gray300, // 'hsl(216 18% 72%)'
      400: tokens.color.gray400, // 'hsl(220 10% 62%)'
      500: tokens.color.gray500, // 'hsl(220 9% 46%)'
      600: tokens.color.gray600, // 'hsl(215 14% 34%)'
      700: tokens.color.gray700, // 'hsl(215 28% 24%)'
      800: tokens.color.gray800, // 'hsl(215 28% 14%)'
      900: tokens.color.gray900, // 'hsl(222 47% 11%)'
      light: tokens.color.gray100, // Alias for common usage
      medium: tokens.color.gray400, // Alias for common usage
      dark: tokens.color.gray600,   // Alias for common usage
    },
    
    // Semantic colors - using new tokens
    success: tokens.color.success,       // 'hsl(158 64% 52%)'
    warning: tokens.color.warningBorder, // 'hsl(36 92% 50%)'
    error: tokens.color.error,           // 'hsl(0 83% 57%)'
    info: tokens.color.info,             // 'hsl(217 91% 60%)'
    
    // Background colors
    background: '#FFF5EE',               // Warm seashell background
    surface: '#FFF7EC',                  // Section background
    card: '#FBFBF9',                     // Card background
    
    // Text colors
    text: {
      primary: tokens.color.gray900,     // 'hsl(222 47% 11%)'
      secondary: tokens.color.gray500,   // 'hsl(220 9% 46%)'
      disabled: tokens.color.gray400,    // 'hsl(220 10% 62%)'
      inverse: tokens.color.white,       // 'hsl(0 0% 100%)'
    },
    
    // Button colors
    button: {
      primary: tokens.color.primary,        // 'hsl(212 100% 40%)'
      primaryPressed: tokens.color.primaryDark, // 'hsl(212 100% 30%)'
      secondary: tokens.color.gray100,      // 'hsl(210 20% 96%)'
      secondaryPressed: tokens.color.gray200, // 'hsl(214 20% 89%)'
      disabled: tokens.color.gray200,       // 'hsl(214 20% 89%)'
      text: tokens.color.white,             // 'hsl(0 0% 100%)'
      textSecondary: tokens.color.gray700,  // 'hsl(215 28% 24%)'
      textDisabled: tokens.color.gray400,   // 'hsl(220 10% 62%)'
    },
    
    // Border colors
    border: {
      light: tokens.color.gray200,       // 'hsl(214 20% 89%)'
      medium: tokens.color.gray300,      // 'hsl(216 18% 72%)'
      dark: tokens.color.gray400,        // 'hsl(220 10% 62%)'
    },
  },
  
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
      xxxxl: 36,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },
  
  borderRadius: {
    none: 0,
    sm: 2,
    small: 2, // Alias for sm
    base: 5, // Standard 5px as specified
    md: 6,
    medium: 6, // Alias for md
    lg: 8,
    xl: 12,
    full: 9999,
  },
  
  shadows: {
    // Button shadow specifications
    button: {
      unpressed: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 5,
      },
      pressed: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 1,
      },
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 10,
    },
  },
  
  // Animation timings as specified
  animation: {
    duration: {
      fast: 200,
      medium: 300,
      slow: 500,
    },
    easing: {
      easeOut: 'ease-out',
      easeIn: 'ease-in',
      easeInOut: 'ease-in-out',
    },
  },
  
  // Layout constants
  layout: {
    screenPadding: 20,
    cardPadding: 16,
    buttonHeight: 48,
    inputHeight: 48,
    headerHeight: 60,
    tabBarHeight: 80,
  },
  
  // Progress circle colors
  progress: {
    background: tokens.color.gray200,
    fill: tokens.color.primary,
    text: tokens.color.gray700,
  },
} as const;

export type Theme = typeof theme;

// Utility function to get theme values
export const getTheme = () => theme;

// Common styles that will be reused
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: tokens.color.white,
    padding: 20,
  },
  card: {
    backgroundColor: tokens.color.white,
    borderRadius: 5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    height: 48,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  input: {
    height: 48,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: tokens.color.gray200,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: tokens.color.white,
  },
  text: {
    primary: {
      color: tokens.color.gray900,
      fontSize: 16,
      fontWeight: '400',
    },
    secondary: {
      color: tokens.color.gray500,
      fontSize: 14,
      fontWeight: '400',
    },
    heading: {
      color: tokens.color.gray900,
      fontSize: 24,
      fontWeight: '700',
    },
  },
} as const;