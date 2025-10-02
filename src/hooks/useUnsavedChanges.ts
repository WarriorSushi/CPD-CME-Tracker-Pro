import { useEffect, useCallback, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

export interface UseUnsavedChangesOptions {
  /**
   * Whether there are unsaved changes
   */
  hasChanges: boolean;

  /**
   * Custom message to show in alert
   */
  message?: string;

  /**
   * Custom title for alert
   */
  title?: string;

  /**
   * Enable/disable the warning
   */
  enabled?: boolean;

  /**
   * Callback when user confirms leaving despite changes
   */
  onLeave?: () => void;

  /**
   * Callback when user cancels navigation
   */
  onStay?: () => void;
}

/**
 * Hook to warn users about unsaved changes when navigating away
 *
 * Features:
 * - Warns on back button press
 * - Warns on navigation away from screen
 * - Customizable alert message
 * - Android hardware back button support
 */
export function useUnsavedChanges({
  hasChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  title = 'Unsaved Changes',
  enabled = true,
  onLeave,
  onStay,
}: UseUnsavedChangesOptions) {
  const navigation = useNavigation();
  const hasChangesRef = useRef(hasChanges);

  // Keep ref in sync
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  /**
   * Show confirmation alert
   */
  const showAlert = useCallback(
    (onConfirm: () => void) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Stay',
            style: 'cancel',
            onPress: () => {
              onStay?.();
            },
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              onLeave?.();
              onConfirm();
            },
          },
        ],
        { cancelable: false }
      );
    },
    [title, message, onLeave, onStay]
  );

  /**
   * Handle navigation interception
   */
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      const beforeRemoveListener = (e: any) => {
        if (!hasChangesRef.current) {
          // No unsaved changes, allow navigation
          return;
        }

        // Prevent navigation
        e.preventDefault();

        // Show confirmation
        showAlert(() => {
          // Remove the listener and navigate
          navigation.removeListener('beforeRemove', beforeRemoveListener);
          navigation.dispatch(e.data.action);
        });
      };

      navigation.addListener('beforeRemove', beforeRemoveListener);

      return () => {
        navigation.removeListener('beforeRemove', beforeRemoveListener);
      };
    }, [enabled, navigation, showAlert])
  );

  /**
   * Handle Android hardware back button
   */
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!hasChangesRef.current) {
          // No unsaved changes, allow back press
          return false;
        }

        // Show confirmation
        showAlert(() => {
          navigation.goBack();
        });

        // Prevent default back behavior
        return true;
      });

      return () => backHandler.remove();
    }, [enabled, navigation, showAlert])
  );

  /**
   * Manually trigger the unsaved changes check
   * Useful for custom navigation buttons
   */
  const checkUnsavedChanges = useCallback(
    (callback: () => void) => {
      if (!enabled || !hasChangesRef.current) {
        callback();
        return;
      }

      showAlert(callback);
    },
    [enabled, showAlert]
  );

  return {
    checkUnsavedChanges,
    hasChanges: hasChangesRef.current,
  };
}
