import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utility for enhanced user experience
 * Provides consistent tactile feedback throughout the app
 */

export class HapticsUtils {
  /**
   * Light impact for subtle interactions (button taps, toggles)
   */
  static light() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Graceful fallback - haptics not available on all devices
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Medium impact for standard interactions (navigation, selections)
   */
  static medium() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Heavy impact for important actions (saves, deletions)
   */
  static heavy() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Success feedback for positive actions (successful save, completion)
   */
  static success() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Warning feedback for cautionary actions (validation errors)
   */
  static warning() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Error feedback for failed actions (save failures, errors)
   */
  static error() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Selection feedback for picker/selector interactions
   */
  static selection() {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  }
}