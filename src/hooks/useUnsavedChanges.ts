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
  const isHandlingBackRef = useRef(false);

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

        // If hardware back is already handling this, skip
        if (isHandlingBackRef.current) {
          return;
        }

        // Prevent navigation
        e.preventDefault();

        // Show confirmation
        showAlert(() => {
          // Remove the listener and navigate
          navigation.removeListener('beforeRemove', beforeRemoveListener);
          try {
            if (e.data.action) {
              navigation.dispatch(e.data.action);
            } else {
              navigation.goBack();
            }
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback to goBack if dispatch fails
            try {
              navigation.goBack();
            } catch (backError) {
              console.error('GoBack error:', backError);
            }
          }
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

        // Mark that we're handling hardware back to prevent double prompt
        isHandlingBackRef.current = true;

        // Show confirmation
        showAlert(() => {
          try {
            navigation.goBack();
          } catch (error) {
            console.error('Hardware back navigation error:', error);
          } finally {
            // Reset flag after navigation completes
            setTimeout(() => {
              isHandlingBackRef.current = false;
            }, 500);
          }
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
