import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utility for enhanced user experience
 * Provides consistent tactile feedback throughout the app
 */

export class HapticsUtils {
  /**
   * Light impact for subtle interactions (button taps, toggles) - 50% weaker
   */
  static light() {
    try {
      // Use selection feedback instead of light impact for weaker feel
      Haptics.selectionAsync();
    } catch (error) {
      // Graceful fallback - haptics not available on all devices
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Medium impact for standard interactions (navigation, selections) - 50% weaker
   */
  static medium() {
    try {
      // Use light impact instead of medium for 50% weaker feel
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Heavy impact for important actions (saves, deletions) - 50% weaker
   */
  static heavy() {
    try {
      // Use light impact instead of heavy for 50% weaker feel
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Success feedback for positive actions (successful save, completion) - 50% weaker
   */
  static success() {
    try {
      // Use light impact instead of notification for subtler success feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Warning feedback for cautionary actions (validation errors) - 50% weaker
   */
  static warning() {
    try {
      // Use selection feedback instead of notification warning for weaker feel
      Haptics.selectionAsync();
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Error feedback for failed actions (save failures, errors) - 50% weaker
   */
  static error() {
    try {
      // Use light impact instead of notification error for weaker feel
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Selection feedback for picker/selector interactions - already weakest
   */
  static selection() {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }
}