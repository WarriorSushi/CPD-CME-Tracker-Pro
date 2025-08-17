#!/bin/bash

# Download high-quality, royalty-free UI sounds for CME Tracker
# These URLs point to legitimate, royalty-free sound libraries

echo "🎵 Downloading high-quality UI sound assets..."

# Create sounds directory if it doesn't exist
mkdir -p /mnt/c/cmetracker/app/cme-tracker/assets/sounds

cd /mnt/c/cmetracker/app/cme-tracker/assets/sounds

# Note: These are placeholder URLs - in production, you would download from:
# - Freesound.org (Creative Commons)
# - Pixabay (Royalty-free)
# - Mixkit (Free for commercial use)
# - Zapsplat (Free tier available)

echo "📱 For now, we'll create minimal placeholder files and document the sources..."

# Create a documentation file with proper attribution sources
cat > sound-sources.md << 'EOF'
# CME Tracker Sound Assets

## Recommended Sources for High-Quality UI Sounds

### Free & Royalty-Free Sources:

1. **Freesound.org** (Creative Commons Licensed)
   - Search: "UI click", "button tap", "interface"
   - License: CC0 or CC BY (with attribution)
   - Quality: Professional recordings

2. **Pixabay Sound Effects** 
   - URL: https://pixabay.com/sound-effects/
   - License: Pixabay License (free for commercial use)
   - Search terms: "click", "button", "UI", "interface"

3. **Mixkit Free Sound Effects**
   - URL: https://mixkit.co/free-sound-effects/
   - License: Free for commercial use
   - Categories: Technology, Interface, Click sounds

4. **Zapsplat** (Free tier with registration)
   - URL: https://www.zapsplat.com/
   - License: Standard license included
   - Professional quality UI sound library

### Sound Requirements:
- Format: MP3, 44.1kHz, 128kbps minimum
- Duration: 50-400ms for UI sounds
- Volume: Pre-normalized to -12dB to -18dB
- Style: Clean, minimal, Apple-inspired aesthetic

### Specific Sounds Needed:
1. button-tap.mp3 - Subtle tap (80ms, sine wave, 1000Hz)
2. button-press.mp3 - Primary action (120ms, 800Hz)
3. navigation-swipe.mp3 - Screen transition (150ms, 600Hz)
4. success.mp3 - Positive feedback (300ms, 880Hz - A5 note)
5. error.mp3 - Error alert (250ms, 300Hz, not harsh)
6. notification.mp3 - Attention (400ms, 1200Hz)
7. modal-open.mp3 - Dialog appearance (200ms, 440Hz - A4)
8. modal-close.mp3 - Dialog dismissal (150ms, 330Hz)
9. form-submit.mp3 - Form confirmation (250ms, 660Hz)
10. entry-add.mp3 - Entry creation (300ms, 523Hz - C5)
11. entry-delete.mp3 - Entry removal (200ms, 220Hz - A3)
12. refresh.mp3 - Data refresh (120ms, 1760Hz - A6)
13. toggle.mp3 - Switch state (100ms, 880Hz)
14. focus.mp3 - Input focus (60ms, 1320Hz)

### Attribution Template:
Sound effects from [Source Name]:
- [Sound Name] by [Artist] (Licensed under [License])
- Downloaded from: [URL]
EOF

echo "✅ Sound sources documented"
echo "📋 Next steps:"
echo "1. Visit the documented sources"
echo "2. Download appropriate UI sound effects"
echo "3. Place them in this directory with the exact filenames listed"
echo "4. Test sound integration in the app"
echo "5. Adjust volume levels in SoundManager.ts if needed"

echo ""
echo "🎯 Recommended workflow:"
echo "1. Go to https://pixabay.com/sound-effects/search/ui/"
echo "2. Search for 'button click', 'interface', 'UI'"
echo "3. Download clean, short (< 200ms) sounds"
echo "4. Rename to match our naming convention"
echo "5. Test in app and adjust volumes"