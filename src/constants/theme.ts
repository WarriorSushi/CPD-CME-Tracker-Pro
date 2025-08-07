// Theme constants for CME Tracker
export const theme = {
  colors: {
    // Primary colors
    primary: '#0066CC',
    primaryDark: '#004A99',
    primaryLight: '#3385D6',
    
    // Secondary colors
    secondary: '#00A86B',
    secondaryDark: '#007A4D',
    secondaryLight: '#33BA85',
    
    // Neutral colors
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Background colors
    background: '#FFFFFF',
    surface: '#F9FAFB',
    card: '#FFFFFF',
    
    // Text colors
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    
    // Button colors
    button: {
      primary: '#0066CC',
      primaryPressed: '#004A99',
      secondary: '#F3F4F6',
      secondaryPressed: '#E5E7EB',
      disabled: '#E5E7EB',
      text: '#FFFFFF',
      textSecondary: '#374151',
      textDisabled: '#9CA3AF',
    },
    
    // Border colors
    border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
      dark: '#9CA3AF',
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
    base: 5, // Standard 5px as specified
    md: 6,
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
    background: '#E5E7EB',
    fill: '#0066CC',
    text: '#374151',
  },
} as const;

export type Theme = typeof theme;

// Utility function to get theme values
export const getTheme = () => theme;

// Common styles that will be reused
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  text: {
    primary: {
      color: '#111827',
      fontSize: 16,
      fontWeight: '400',
    },
    secondary: {
      color: '#6B7280',
      fontSize: 14,
      fontWeight: '400',
    },
    heading: {
      color: '#111827',
      fontSize: 24,
      fontWeight: '700',
    },
  },
} as const;