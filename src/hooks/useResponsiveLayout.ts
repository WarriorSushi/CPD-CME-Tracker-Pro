import { useState, useEffect } from 'react';
import { Dimensions, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ResponsiveLayoutData {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  isTablet: boolean;
  isLandscape: boolean;
  isFoldable: boolean;
  isLargeScreen: boolean;
  deviceType: 'phone' | 'tablet' | 'foldable';
  safeMargins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  edgeToEdgeStyles: {
    paddingTop: number;
    paddingBottom: number;
    paddingLeft: number;
    paddingRight: number;
  };
}

export const useResponsiveLayout = (): ResponsiveLayoutData => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Device type detection
  const isTablet = screenData.width >= 768 || screenData.height >= 768;
  const isLandscape = screenData.width > screenData.height;
  const isFoldable = screenData.width >= 600 && screenData.height >= 600 && !isTablet;
  const isLargeScreen = screenData.width >= 600;

  // Determine device type
  let deviceType: 'phone' | 'tablet' | 'foldable' = 'phone';
  if (isTablet) {
    deviceType = 'tablet';
  } else if (isFoldable) {
    deviceType = 'foldable';
  }

  // Safe margins for edge-to-edge display
  const safeMargins = {
    top: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 20),
    bottom: Math.max(insets.bottom, 16),
    left: Math.max(insets.left, 16),
    right: Math.max(insets.right, 16),
  };

  // Edge-to-edge styling for components
  const edgeToEdgeStyles = {
    paddingTop: safeMargins.top,
    paddingBottom: safeMargins.bottom,
    paddingLeft: isTablet ? 32 : safeMargins.left,
    paddingRight: isTablet ? 32 : safeMargins.right,
  };

  return {
    width: screenData.width,
    height: screenData.height,
    scale: screenData.scale,
    fontScale: screenData.fontScale,
    insets,
    isTablet,
    isLandscape,
    isFoldable,
    isLargeScreen,
    deviceType,
    safeMargins,
    edgeToEdgeStyles,
  };
};