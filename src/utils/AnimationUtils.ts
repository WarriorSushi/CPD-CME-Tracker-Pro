import { Animated } from 'react-native';

/**
 * Animation utilities to prevent useNativeDriver conflicts
 * All shadow/elevation animations should use these utilities
 */

export class AnimationUtils {
  /**
   * Safely set shadow animation value without conflicts
   * Use this instead of Animated.timing with useNativeDriver: false
   */
  static setShadowValue = (animatedValue: Animated.Value, delay: number = 100) => {
    setTimeout(() => {
      animatedValue.setValue(1);
    }, delay);
  };

  /**
   * Safely set multiple shadow values in sequence
   */
  static setShadowValues = (animatedValues: Animated.Value[], baseDelay: number = 100, stagger: number = 50) => {
    animatedValues.forEach((animatedValue, index) => {
      setTimeout(() => {
        animatedValue.setValue(1);
      }, baseDelay + (index * stagger));
    });
  };

  /**
   * Standard entrance animation (safe for all screens)
   */
  static createEntranceAnimation = (
    fadeAnim: Animated.Value,
    slideAnim: Animated.Value,
    onComplete?: () => void
  ) => {
    return Animated.parallel([
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
    ]);
  };

  /**
   * Standard scale animation for cards/elements
   */
  static createScaleAnimation = (
    scaleAnim: Animated.Value,
    toValue: number = 1,
    tension: number = 40,
    friction: number = 8
  ) => {
    return Animated.spring(scaleAnim, {
      toValue,
      tension,
      friction,
      useNativeDriver: true,
    });
  };

  /**
   * Staggered card animations (safe)
   */
  static createStaggeredCardAnimation = (
    cardAnims: Animated.Value[],
    delay: number = 100
  ) => {
    return Animated.stagger(
      delay,
      cardAnims.map(anim =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        })
      )
    );
  };

  /**
   * Progress bar animation (safe)
   */
  static createProgressAnimation = (
    progressAnim: Animated.Value,
    duration: number = 600,
    delay: number = 100
  ) => {
    return Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });
  };
}

/**
 * Hook for common screen animations
 */
export const useScreenAnimations = () => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);
  const scaleAnim = new Animated.Value(0.9);

  const animateIn = (onComplete?: () => void) => {
    AnimationUtils.createEntranceAnimation(fadeAnim, slideAnim, onComplete).start(onComplete);
  };

  return {
    fadeAnim,
    slideAnim,
    scaleAnim,
    animateIn,
  };
};