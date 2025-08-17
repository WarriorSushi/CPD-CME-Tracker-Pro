import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSound } from './useSound';

interface UseNavigationSoundsOptions {
  enabled?: boolean;
  volume?: number;
  playSoundsOnNavigate?: boolean;
  playSoundsOnModalOpen?: boolean;
}

export const useNavigationSounds = (options: UseNavigationSoundsOptions = {}) => {
  const {
    enabled = true,
    volume,
    playSoundsOnNavigate = true,
    playSoundsOnModalOpen = true,
  } = options;

  const navigation = useNavigation();
  const { playNavigation, playModalOpen, playModalClose } = useSound({ 
    enabled, 
    volume 
  });

  useEffect(() => {
    if (!enabled || !playSoundsOnNavigate) return;

    // Listen for navigation state changes
    const unsubscribe = navigation.addListener('state' as any, (e) => {
      // Debounce rapid navigation changes
      const navigationTimeout = setTimeout(() => {
        if (enabled) {
          playNavigation();
        }
      }, 50);

      return () => clearTimeout(navigationTimeout);
    });

    return unsubscribe;
  }, [navigation, enabled, playSoundsOnNavigate, playNavigation]);

  // Convenience methods for manual sound triggering
  const playScreenTransition = () => {
    if (enabled) playNavigation();
  };

  const playModal = (type: 'open' | 'close') => {
    if (!enabled || !playSoundsOnModalOpen) return;
    
    if (type === 'open') {
      playModalOpen();
    } else {
      playModalClose();
    }
  };

  return {
    playScreenTransition,
    playModal,
    playModalOpen: () => playModal('open'),
    playModalClose: () => playModal('close'),
  };
};

export default useNavigationSounds;