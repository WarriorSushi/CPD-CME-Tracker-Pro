// Fallback Sound Manager for when expo-audio is not available
// This provides the same interface but with no actual audio output

import AsyncStorage from '@react-native-async-storage/async-storage';

export type SoundType = 
  | 'buttonTap' 
  | 'buttonPress' 
  | 'navigationSwipe'
  | 'success' 
  | 'error' 
  | 'notification'
  | 'modalOpen'
  | 'modalClose'
  | 'formSubmit'
  | 'entryAdd'
  | 'entryDelete'
  | 'refresh'
  | 'toggle'
  | 'focus';

class SoundManagerFallback {
  private isEnabled: boolean = true;
  private globalVolume: number = 0.3;
  private isInitialized: boolean = false;

  constructor() {
    this.loadSettings();
    this.isInitialized = true;
  }

  private async loadSettings() {
    try {
      const soundEnabled = await AsyncStorage.getItem('sound_enabled');
      const soundVolume = await AsyncStorage.getItem('sound_volume');
      
      this.isEnabled = soundEnabled !== 'false';
      this.globalVolume = soundVolume ? parseFloat(soundVolume) : 0.3;
    } catch (error) {
      __DEV__ && console.warn('Failed to load sound settings:', error);
    }
  }

  async preloadSounds() {
    // No-op in fallback mode
    __DEV__ && console.log('[SOUND] Sound system running in fallback mode (no audio)');
  }

  async play(soundType: SoundType, options?: { volume?: number; rate?: number }) {
    if (!this.isEnabled || !this.isInitialized) return;
    
    // Log the sound that would have been played
    __DEV__ && console.log(`[SOUND MUTED] Would play sound: ${soundType} at volume ${(options?.volume ?? 0.3) * this.globalVolume}`);
  }

  // Convenience methods for common interactions
  async playButtonTap() {
    return this.play('buttonTap');
  }

  async playButtonPress() {
    return this.play('buttonPress');
  }

  async playSuccess() {
    return this.play('success');
  }

  async playError() {
    return this.play('error');
  }

  async playNavigation() {
    return this.play('navigationSwipe');
  }

  async playModalOpen() {
    return this.play('modalOpen');
  }

  async playModalClose() {
    return this.play('modalClose');
  }

  async playEntryAdd() {
    return this.play('entryAdd');
  }

  async playEntryDelete() {
    return this.play('entryDelete');
  }

  async playFormSubmit() {
    return this.play('formSubmit');
  }

  async playRefresh() {
    return this.play('refresh');
  }

  async playToggle() {
    return this.play('toggle');
  }

  async playFocus() {
    return this.play('focus');
  }

  // Settings management
  async setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    await AsyncStorage.setItem('sound_enabled', enabled.toString());
  }

  async setGlobalVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    await AsyncStorage.setItem('sound_volume', this.globalVolume.toString());
  }

  getGlobalVolume(): number {
    return this.globalVolume;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  async dispose() {
    // No-op in fallback mode
  }
}

export const soundManagerFallback = new SoundManagerFallback();
export default soundManagerFallback;