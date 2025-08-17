import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { soundManager } from '../services/sound/SoundManager';
import { useSound } from '../hooks/useSound';

interface SoundContextType {
  // Global sound settings
  isEnabled: boolean;
  globalVolume: number;
  
  // Settings management
  setEnabled: (enabled: boolean) => Promise<void>;
  setGlobalVolume: (volume: number) => Promise<void>;
  
  // Sound triggers for app-wide events
  playSuccessSound: () => Promise<void>;
  playErrorSound: () => Promise<void>;
  playEntryAddSound: () => Promise<void>;
  playEntryDeleteSound: () => Promise<void>;
  playFormSubmitSound: () => Promise<void>;
  playRefreshSound: () => Promise<void>;
  playNotificationSound: () => Promise<void>;
  
  // Direct access to sound manager
  soundManager: typeof soundManager;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const {
    playSuccess,
    playError,
    playEntryAdd,
    playEntryDelete,
    playFormSubmit,
    playRefresh,
    soundManager: sm,
  } = useSound();

  useEffect(() => {
    // Initialize sound system when provider mounts
    soundManager.preloadSounds();
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    await soundManager.setEnabled(enabled);
  }, []);

  const setGlobalVolume = useCallback(async (volume: number) => {
    await soundManager.setGlobalVolume(volume);
  }, []);

  const playSuccessSound = useCallback(async () => {
    await playSuccess();
  }, [playSuccess]);

  const playErrorSound = useCallback(async () => {
    await playError();
  }, [playError]);

  const playEntryAddSound = useCallback(async () => {
    await playEntryAdd();
  }, [playEntryAdd]);

  const playEntryDeleteSound = useCallback(async () => {
    await playEntryDelete();
  }, [playEntryDelete]);

  const playFormSubmitSound = useCallback(async () => {
    await playFormSubmit();
  }, [playFormSubmit]);

  const playRefreshSound = useCallback(async () => {
    await playRefresh();
  }, [playRefresh]);

  const playNotificationSound = useCallback(async () => {
    await soundManager.play('notification');
  }, []);

  const contextValue: SoundContextType = {
    isEnabled: soundManager.isAudioEnabled(),
    globalVolume: soundManager.getGlobalVolume(),
    setEnabled,
    setGlobalVolume,
    playSuccessSound,
    playErrorSound,
    playEntryAddSound,
    playEntryDeleteSound,
    playFormSubmitSound,
    playRefreshSound,
    playNotificationSound,
    soundManager,
  };

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundContext = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
};

export default SoundContext;