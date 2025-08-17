import { useCallback, useEffect } from 'react';
import { soundManager, SoundType } from '../services/sound/SoundManager';

interface UseSoundOptions {
  enabled?: boolean;
  volume?: number;
}

export const useSound = (options: UseSoundOptions = {}) => {
  const { enabled = true, volume } = options;

  useEffect(() => {
    // Initialize sound system when component mounts
    soundManager.preloadSounds();
  }, []);

  const playSound = useCallback(async (soundType: SoundType, customVolume?: number) => {
    if (!enabled) return;
    
    await soundManager.play(soundType, { 
      volume: customVolume ?? volume 
    });
  }, [enabled, volume]);

  // Convenience methods for common interactions
  const playButtonTap = useCallback(() => {
    if (enabled) soundManager.playButtonTap();
  }, [enabled]);

  const playButtonPress = useCallback(() => {
    if (enabled) soundManager.playButtonPress();
  }, [enabled]);

  const playSuccess = useCallback(() => {
    if (enabled) soundManager.playSuccess();
  }, [enabled]);

  const playError = useCallback(() => {
    if (enabled) soundManager.playError();
  }, [enabled]);

  const playNavigation = useCallback(() => {
    if (enabled) soundManager.playNavigation();
  }, [enabled]);

  const playModalOpen = useCallback(() => {
    if (enabled) soundManager.playModalOpen();
  }, [enabled]);

  const playModalClose = useCallback(() => {
    if (enabled) soundManager.playModalClose();
  }, [enabled]);

  const playEntryAdd = useCallback(() => {
    if (enabled) soundManager.playEntryAdd();
  }, [enabled]);

  const playEntryDelete = useCallback(() => {
    if (enabled) soundManager.playEntryDelete();
  }, [enabled]);

  const playFormSubmit = useCallback(() => {
    if (enabled) soundManager.playFormSubmit();
  }, [enabled]);

  const playRefresh = useCallback(() => {
    if (enabled) soundManager.playRefresh();
  }, [enabled]);

  const playToggle = useCallback(() => {
    if (enabled) soundManager.playToggle();
  }, [enabled]);

  const playFocus = useCallback(() => {
    if (enabled) soundManager.playFocus();
  }, [enabled]);

  return {
    playSound,
    playButtonTap,
    playButtonPress,
    playSuccess,
    playError,
    playNavigation,
    playModalOpen,
    playModalClose,
    playEntryAdd,
    playEntryDelete,
    playFormSubmit,
    playRefresh,
    playToggle,
    playFocus,
    
    // Direct access to sound manager for advanced usage
    soundManager,
  };
};

export default useSound;