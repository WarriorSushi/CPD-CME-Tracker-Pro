// Design tokens - Single source of truth for CME Tracker
export const tokens = {
  color: {
    // Brand colors
    primary:        'hsl(212 100% 40%)', // #0066CC
    primaryDark:    'hsl(212 100% 30%)', // #004A99
    primaryLight:   'hsl(212 60% 55%)',  // ~#3385D6

    // Base colors
    white:          'hsl(0 0% 100%)',    // #FFFFFF
    black:          'hsl(0 0% 0%)',      // #000000

    // Gray scale
    gray50:         'hsl(210 20% 98%)',  // #F9FAFB
    gray100:        'hsl(210 20% 96%)',  // #F3F4F6
    gray200:        'hsl(214 20% 89%)',  // #E5E7EB
    gray300:        'hsl(216 18% 72%)',  // #D1D5DB
    gray400:        'hsl(220 10% 62%)',  // #9CA3AF
    gray500:        'hsl(220 9% 46%)',   // #6B7280
    gray600:        'hsl(215 14% 34%)',  // #4B5563
    gray700:        'hsl(215 28% 24%)',  // #374151
    gray800:        'hsl(215 28% 14%)',  // #1F2937
    gray900:        'hsl(222 47% 11%)',  // #111827

    // Semantic colors
    selectedBg:     'hsl(212 65% 92%)',  // #E6F0FA

    success:        'hsl(158 64% 52%)',  // #10B981
    warningBg:      'hsl(33 100% 95%)',  // #FFF7ED
    warningBorder:  'hsl(36 92% 50%)',   // #F59E0B
    warningText:    'hsl(26 91% 31%)',   // #92400E
    error:          'hsl(0 83% 57%)',    // #EF4444
    info:           'hsl(217 91% 60%)',  // #3B82F6
  },
  
  // Border radius
  radius: { 
    card: 12, 
    button: 5, 
    chip: 999,
    small: 4,
    medium: 8,
    large: 16
  },
  
  // Spacing scale
  space: { 
    0: 0, 
    1: 4, 
    2: 8, 
    3: 12, 
    4: 16, 
    5: 20, 
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80
  },
  
  // Typography scale
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    xxxxl: 36
  },
  
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  
  // Shadow system
  shadow: {
    card: { 
      offset: { width: 0, height: 2 }, 
      radius: 6, 
      opacity: 0.04, 
      color: '#000' 
    },
    elevated: { 
      offset: { width: 0, height: 4 }, 
      radius: 10, 
      opacity: 0.06, 
      color: '#000' 
    },
    ledge: {
      primary: { 
        offset: { width: 0, height: 5 }, 
        radius: 0, 
        opacity: 1, 
        color: 'hsl(212 100% 30%)' 
      },
      gray: { 
        offset: { width: 0, height: 2 }, 
        radius: 0, 
        opacity: 1, 
        color: 'hsl(216 18% 72%)' 
      },
      error: { 
        offset: { width: 0, height: 2 }, 
        radius: 0, 
        opacity: 1, 
        color: 'hsl(0 83% 45%)' 
      }
    }
  }
};

// Temporary passthrough utility if hex strictly needed later
export const hex = (hsl: string) => hsl;

// Type definitions for better TypeScript support
export type ColorToken = keyof typeof tokens.color;
export type RadiusToken = keyof typeof tokens.radius;
export type SpaceToken = keyof typeof tokens.space;
export type FontSizeToken = keyof typeof tokens.fontSize;
export type FontWeightToken = keyof typeof tokens.fontWeight;