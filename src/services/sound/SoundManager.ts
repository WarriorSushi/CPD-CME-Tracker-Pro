import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
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

interface SoundConfig {
  source: any; // require() result
  volume: number;
  player?: any; // AudioPlayer instance from createAudioPlayer
}

class SoundManager {
  private sounds: Map<SoundType, SoundConfig> = new Map();
  private isEnabled: boolean = true;
  private globalVolume: number = 1.0; // Keep at 100% since individual volumes are already set
  private isInitialized: boolean = false;
  private isPreloaded: boolean = false;

  constructor() {
    this.loadSettings();
    this.initializeSounds();
  }

  private async loadSettings() {
    try {
      const soundEnabled = await AsyncStorage.getItem('sound_enabled');
      const soundVolume = await AsyncStorage.getItem('sound_volume');
      
      this.isEnabled = soundEnabled !== 'false'; // Default to true
      this.globalVolume = soundVolume ? parseFloat(soundVolume) : 1.0;
    } catch (error) {
      __DEV__ && console.warn('Failed to load sound settings:', error);
    }
  }

  private initializeSounds() {
    // Only keeping 4 essential sounds as requested
    
    // Button interactions - using button-press.mp3 for ALL button interactions
    this.sounds.set('buttonTap', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    this.sounds.set('buttonPress', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    // Navigation - using navigation-swipe.mp3
    this.sounds.set('navigationSwipe', {
      source: require('../../../assets/sounds/navigation-swipe.mp3'),
      volume: 0.35, // 35% volume
    });

    // Error feedback - using error.mp3
    this.sounds.set('error', {
      source: require('../../../assets/sounds/error.mp3'),
      volume: 0.7, // 70% volume
    });

    // Notifications - using notification.mp3
    this.sounds.set('notification', {
      source: require('../../../assets/sounds/notification.mp3'),
      volume: 1.0, // 100% volume
    });

    // Map all other interactions to button-press for consistency
    this.sounds.set('formSubmit', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    this.sounds.set('refresh', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    this.sounds.set('toggle', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    this.sounds.set('focus', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    this.sounds.set('modalOpen', {
      source: require('../../../assets/sounds/navigation-swipe.mp3'),
      volume: 0.35, // 35% volume
    });

    this.sounds.set('modalClose', {
      source: require('../../../assets/sounds/navigation-swipe.mp3'),
      volume: 0.35, // 35% volume
    });

    // Remove deleted sounds - map to existing ones
    this.sounds.set('success', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    this.sounds.set('entryAdd', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    this.sounds.set('entryDelete', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.65, // 65% volume
    });

    this.isInitialized = true;
  }

  async preloadSounds() {
    // Prevent multiple initializations
    if (this.isPreloaded || !this.isEnabled) return;
    
    this.isPreloaded = true;

    try {
      // Preload frequently used sounds
      const frequentSounds: SoundType[] = ['buttonTap', 'buttonPress', 'error'];
      
      for (const soundType of frequentSounds) {
        try {
          await this.preloadSound(soundType);
        } catch (soundError) {
          __DEV__ && console.warn(`Failed to preload ${soundType}:`, soundError);
          // Continue with other sounds even if one fails
        }
      }

      __DEV__ && console.log('[INFO] Sound system initialized successfully with expo-audio');
    } catch (error) {
      __DEV__ && console.warn('Failed to initialize sound system:', error);
      // Disable sounds if initialization fails completely
      this.isEnabled = false;
      this.isPreloaded = false; // Reset flag on failure
    }
  }

  private async preloadSound(soundType: SoundType) {
    const config = this.sounds.get(soundType);
    if (!config || config.player) return;

    try {
      const player = createAudioPlayer(config.source);
      player.volume = config.volume * this.globalVolume;
      config.player = player;
    } catch (error) {
      __DEV__ && console.warn(`Failed to preload sound ${soundType}:`, error);
      // Mark as failed to prevent repeated attempts
      config.player = null;
    }
  }

  async play(soundType: SoundType, options?: { volume?: number; rate?: number }) {
    if (!this.isEnabled || !this.isInitialized) return;

    const config = this.sounds.get(soundType);
    if (!config) {
      __DEV__ && console.warn(`Sound ${soundType} not found`);
      return;
    }

    // Skip if we know this sound failed to load
    if (config.player === null) return;

    try {
      let player = config.player;
      
      if (!player) {
        // Create player on-demand if not preloaded
        player = createAudioPlayer(config.source);
        config.player = player;
      }

      // Set volume
      const finalVolume = (options?.volume ?? config.volume) * this.globalVolume;
      player.volume = Math.max(0, Math.min(1, finalVolume));

      // Reset position and play the sound (expo-audio doesn't auto-reset)
      player.seekTo(0);
      player.play();

    } catch (error) {
      __DEV__ && console.warn(`Failed to play sound ${soundType}:`, error);
      // Mark as failed to prevent repeated attempts
      config.player = null;
    }
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
    this.globalVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0-1
    await AsyncStorage.setItem('sound_volume', this.globalVolume.toString());
    
    // Update all cached players with new volume
    for (const [soundType, config] of this.sounds.entries()) {
      if (config.player && config.player !== null) {
        config.player.volume = config.volume * this.globalVolume;
      }
    }
  }

  getGlobalVolume(): number {
    return this.globalVolume;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  // Clean up resources
  async dispose() {
    for (const [, config] of this.sounds.entries()) {
      if (config.player && config.player !== null) {
        try {
          config.player.release();
        } catch (error) {
          __DEV__ && console.warn('Error disposing audio player:', error);
        }
      }
    }
    this.sounds.clear();
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
export default soundManager;