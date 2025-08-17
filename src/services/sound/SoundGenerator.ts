// Sound Generator for creating high-quality UI sound assets
// This file will help us generate Apple-inspired, aesthetic UI sounds programmatically

export interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
}

// Apple-inspired sound configurations
export const soundConfigs = {
  buttonTap: {
    frequency: 1000, // Clean, crisp frequency
    duration: 0.08,  // Very short
    volume: 0.2,
    attack: 0.01,
    decay: 0.02,
    sustain: 0.1,
    release: 0.05,
    waveform: 'sine' as const,
    description: 'Subtle tap sound for lightweight interactions'
  },

  buttonPress: {
    frequency: 800,  // Slightly lower, more substantial
    duration: 0.12,
    volume: 0.25,
    attack: 0.01,
    decay: 0.03,
    sustain: 0.2,
    release: 0.08,
    waveform: 'triangle' as const,
    description: 'Primary button press with more presence'
  },

  navigationSwipe: {
    frequency: 600,  // Lower frequency sweep
    duration: 0.15,
    volume: 0.15,
    attack: 0.005,
    decay: 0.04,
    sustain: 0.1,
    release: 0.105,
    waveform: 'triangle' as const,
    description: 'Smooth navigation transition'
  },

  success: {
    frequency: 880,  // A5 note - pleasant, positive
    duration: 0.3,
    volume: 0.4,
    attack: 0.01,
    decay: 0.05,
    sustain: 0.15,
    release: 0.13,
    waveform: 'sine' as const,
    description: 'Success confirmation with musical quality'
  },

  error: {
    frequency: 300,  // Lower, more serious tone
    duration: 0.25,
    volume: 0.35,
    attack: 0.02,
    decay: 0.08,
    sustain: 0.1,
    release: 0.05,
    waveform: 'triangle' as const,
    description: 'Error alert without being harsh'
  },

  notification: {
    frequency: 1200, // Attention-getting but not jarring
    duration: 0.4,
    volume: 0.3,
    attack: 0.02,
    decay: 0.1,
    sustain: 0.2,
    release: 0.08,
    waveform: 'sine' as const,
    description: 'Notification chime with pleasant decay'
  },

  modalOpen: {
    frequency: 440,  // A4 note
    duration: 0.2,
    volume: 0.2,
    attack: 0.05,   // Slower attack for modal opening
    decay: 0.05,
    sustain: 0.05,
    release: 0.05,
    waveform: 'sine' as const,
    description: 'Modal appearance with gentle fade-in'
  },

  modalClose: {
    frequency: 330,  // Lower than open for dismissal
    duration: 0.15,
    volume: 0.18,
    attack: 0.01,
    decay: 0.02,
    sustain: 0.02,
    release: 0.1,   // Longer release for fade-out effect
    waveform: 'sine' as const,
    description: 'Modal dismissal with gentle fade-out'
  },

  formSubmit: {
    frequency: 660,  // E5 note
    duration: 0.25,
    volume: 0.25,
    attack: 0.01,
    decay: 0.04,
    sustain: 0.12,
    release: 0.08,
    waveform: 'triangle' as const,
    description: 'Form submission confirmation'
  },

  entryAdd: {
    frequency: 523,  // C5 note - positive major third
    duration: 0.3,
    volume: 0.3,
    attack: 0.01,
    decay: 0.05,
    sustain: 0.15,
    release: 0.09,
    waveform: 'sine' as const,
    description: 'Entry addition with musical satisfaction'
  },

  entryDelete: {
    frequency: 220,  // A3 note - lower, more subdued
    duration: 0.2,
    volume: 0.25,
    attack: 0.01,
    decay: 0.04,
    sustain: 0.08,
    release: 0.07,
    waveform: 'triangle' as const,
    description: 'Entry deletion without being harsh'
  },

  refresh: {
    frequency: 1760, // A6 note - bright but subtle
    duration: 0.12,
    volume: 0.2,
    attack: 0.005,
    decay: 0.02,
    sustain: 0.05,
    release: 0.045,
    waveform: 'sine' as const,
    description: 'Data refresh with crisp, clean tone'
  },

  toggle: {
    frequency: 880,  // A5 note
    duration: 0.1,
    volume: 0.22,
    attack: 0.005,
    decay: 0.015,
    sustain: 0.03,
    release: 0.05,
    waveform: 'triangle' as const,
    description: 'Toggle switch with clear state change'
  },

  focus: {
    frequency: 1320, // E6 note - subtle attention
    duration: 0.06,
    volume: 0.15,
    attack: 0.005,
    decay: 0.01,
    sustain: 0.02,
    release: 0.025,
    waveform: 'sine' as const,
    description: 'Input focus with very subtle indication'
  },
};

// Instructions for generating actual sound files
export const soundGenerationInstructions = `
To generate high-quality sound files from these configurations:

1. Use a digital audio workstation (DAW) like:
   - GarageBand (Mac) - Free and excellent for this purpose
   - Audacity - Free, cross-platform
   - Logic Pro - Professional option
   - Ableton Live - Professional option

2. For each sound configuration:
   - Create a new audio track
   - Add a synthesizer/oscillator
   - Set the waveform (sine, triangle, etc.)
   - Configure the ADSR envelope:
     * Attack: ${soundConfigs.buttonTap.attack}s
     * Decay: ${soundConfigs.buttonTap.decay}s  
     * Sustain: ${soundConfigs.buttonTap.sustain}
     * Release: ${soundConfigs.buttonTap.release}s
   - Set the note/frequency
   - Record at 44.1kHz, 16-bit minimum
   - Export as MP3 (128kbps or higher) for app use

3. Apple-style sound characteristics:
   - Clean sine waves for most UI sounds
   - Very short durations (50-300ms)
   - Gentle attack and release curves
   - Musical frequencies (notes) for pleasant harmony
   - Low volume levels for unintrusive experience
   - No distortion or harsh frequencies

4. File naming convention:
   - button-tap.mp3
   - button-press.mp3
   - navigation-swipe.mp3
   - success.mp3
   - error.mp3
   - notification.mp3
   - modal-open.mp3
   - modal-close.mp3
   - form-submit.mp3
   - entry-add.mp3
   - entry-delete.mp3
   - refresh.mp3
   - toggle.mp3
   - focus.mp3

5. Testing tips:
   - Test on actual device speakers and headphones
   - Ensure sounds don't interfere with music/calls
   - Check that volume levels are consistent
   - Verify sounds work well in silent/vibrate mode settings
`;

export default soundConfigs;