import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * Custom hook for managing dashboard card animations
 *
 * Provides:
 * - Entrance animations for cards
 * - Staggered card appearances
 * - Shadow animations (delayed to prevent gray flash)
 * - Progress section gradient animations
 */
export const useDashboardAnimations = (isInitializing: boolean, hasUser: boolean) => {
  // Main entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Card animations
  const progressCardAnim = useRef(new Animated.Value(0)).current;
  const remindersCardAnim = useRef(new Animated.Value(0)).current;
  const recentCardAnim = useRef(new Animated.Value(0)).current;
  const licensesCardAnim = useRef(new Animated.Value(0)).current;

  // Shadow animations (to prevent gray flash)
  const progressShadowAnim = useRef(new Animated.Value(0)).current;
  const remindersShadowAnim = useRef(new Animated.Value(0)).current;
  const recentShadowAnim = useRef(new Animated.Value(0)).current;
  const licensesShadowAnim = useRef(new Animated.Value(0)).current;

  // Progress section animated gradient values
  const progressGradient1 = useRef(new Animated.Value(0)).current;
  const progressGradient2 = useRef(new Animated.Value(0)).current;
  const progressGradient3 = useRef(new Animated.Value(0)).current;

  // Premium entrance animations
  useEffect(() => {
    if (!isInitializing && hasUser) {
      // Stage 1: Cards appear without shadows
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Stage 2: Staggered card animations
      Animated.sequence([
        Animated.delay(200),
        Animated.stagger(150, [
          Animated.spring(progressCardAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(remindersCardAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(recentCardAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(licensesCardAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Stage 3: Add shadows after cards finish (using separate timing to avoid conflicts)
        setTimeout(() => {
          progressShadowAnim.setValue(1);
          remindersShadowAnim.setValue(1);
          recentShadowAnim.setValue(1);
          licensesShadowAnim.setValue(1);
        }, 100);
      });
    }
  }, [isInitializing, hasUser]);

  // Progress section animated gradient loop
  useEffect(() => {
    // Create continuous flowing gradient animations for progress section
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(progressGradient1, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(progressGradient1, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.delay(1333),
          Animated.timing(progressGradient2, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(progressGradient2, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.delay(2666),
          Animated.timing(progressGradient3, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(progressGradient3, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();
  }, []);

  return {
    // Main entrance
    fadeAnim,
    slideAnim,

    // Card animations
    progressCardAnim,
    remindersCardAnim,
    recentCardAnim,
    licensesCardAnim,

    // Shadow animations
    progressShadowAnim,
    remindersShadowAnim,
    recentShadowAnim,
    licensesShadowAnim,

    // Gradient animations
    progressGradient1,
    progressGradient2,
    progressGradient3,
  };
};
