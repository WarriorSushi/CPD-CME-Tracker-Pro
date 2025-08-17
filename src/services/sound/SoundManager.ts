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
  private globalVolume: number = 0.3; // Low volume by default for aesthetic experience
  private isInitialized: boolean = false;

  constructor() {
    this.loadSettings();
    this.initializeSounds();
  }

  private async loadSettings() {
    try {
      const soundEnabled = await AsyncStorage.getItem('sound_enabled');
      const soundVolume = await AsyncStorage.getItem('sound_volume');
      
      this.isEnabled = soundEnabled !== 'false'; // Default to true
      this.globalVolume = soundVolume ? parseFloat(soundVolume) : 0.3;
    } catch (error) {
      __DEV__ && console.warn('Failed to load sound settings:', error);
    }
  }

  private initializeSounds() {
    // Using available sound files with intelligent mapping for different interaction types
    
    // Button interactions - using button-press.mp3
    this.sounds.set('buttonTap', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.15, // Lower volume for light taps
    });

    this.sounds.set('buttonPress', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.25, // Higher volume for primary actions
    });

    // Navigation - using navigation-swipe.mp3
    this.sounds.set('navigationSwipe', {
      source: require('../../../assets/sounds/navigation-swipe.mp3'),
      volume: 0.18, // Subtle for navigation
    });

    // Success/positive feedback - using entry-add.mp3 (sounds positive)
    this.sounds.set('success', {
      source: require('../../../assets/sounds/entry-add.mp3'),
      volume: 0.35, // More noticeable for positive feedback
    });

    // Error feedback - using error.mp3
    this.sounds.set('error', {
      source: require('../../../assets/sounds/error.mp3'),
      volume: 0.3, // Noticeable but not harsh
    });

    // Notifications - using notification.mp3
    this.sounds.set('notification', {
      source: require('../../../assets/sounds/notification.mp3'),
      volume: 0.25, // Balanced for alerts
    });

    // Modal interactions - using navigation-swipe.mp3 with different volumes
    this.sounds.set('modalOpen', {
      source: require('../../../assets/sounds/navigation-swipe.mp3'),
      volume: 0.15, // Subtle for modal appearance
    });

    this.sounds.set('modalClose', {
      source: require('../../../assets/sounds/navigation-swipe.mp3'),
      volume: 0.12, // Even more subtle for dismissal
    });

    // Form submission - using button-press.mp3 with higher volume
    this.sounds.set('formSubmit', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.28, // Confirming but not overwhelming
    });

    // Entry management - using dedicated entry sounds
    this.sounds.set('entryAdd', {
      source: require('../../../assets/sounds/entry-add.mp3'),
      volume: 0.3, // Positive reinforcement
    });

    this.sounds.set('entryDelete', {
      source: require('../../../assets/sounds/entry-delete.mp3'),
      volume: 0.25, // Subtle for destructive actions
    });

    // System interactions - using button-press.mp3 with low volume
    this.sounds.set('refresh', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.15, // Very subtle for data refresh
    });

    this.sounds.set('toggle', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.18, // Clear but soft for switches
    });

    this.sounds.set('focus', {
      source: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.1, // Very subtle for input focus
    });

    this.isInitialized = true;
  }

  async preloadSounds() {
    if (!this.isEnabled) return;

    try {
      // Preload frequently used sounds
      const frequentSounds: SoundType[] = ['buttonTap', 'buttonPress', 'success'];
      
      for (const soundType of frequentSounds) {
        try {
          await this.preloadSound(soundType);
        } catch (soundError) {
          __DEV__ && console.warn(`Failed to preload ${soundType}:`, soundError);
          // Continue with other sounds even if one fails
        }
      }

      __DEV__ && console.log('✅ Sound system initialized successfully with expo-audio');
    } catch (error) {
      __DEV__ && console.warn('Failed to initialize sound system:', error);
      // Disable sounds if initialization fails completely
      this.isEnabled = false;
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