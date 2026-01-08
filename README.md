# Tenna Soundboard

A standalone, mobile-optimized music player and sound effects board. Perfect for streaming, content creation, or just having fun with music and sound effects.

## Features

- **Music Player**: Play, pause, skip, shuffle, loop, and mute controls
- **Progress Bar**: Seekable progress bar with time display (no restart on drag)
- **Volume Control**: Separate controls for music and sound effects
- **Music Grid**: Visual grid of music tracks with icons
- **Sound Effects**: Categorized sound effects with icons and visual feedback
- **Search/Filter**: Real-time search to filter music and sound effects
- **State Persistence**: Saves your current song, position, volume, and settings
- **Mobile Optimized**: Touch-friendly interface with large buttons
- **PWA Support**: Can be installed as a web app on mobile devices
- **GitHub Pages Ready**: Optimized for deployment on GitHub Pages

## Setup

1. **Add Music Files**:
   - Place your `.mp3`, `.wav`, or `.ogg` files in the `Music/` folder
   - Place matching `.png` icon images in the `Music Icons/` folder (same name as music file, without extension)

2. **Generate Manifest**:
   ```bash
   node generate-manifest.js
   ```
   This will scan the `Music/` folder and update `manifest.json` with all available tracks.

3. **Add Icons** (Optional):
   - Place control icons in the `Icons/` folder:
     - `Music Icon.png` - Main toggle button icon
     - `Pause Icon.png` - Pause button icon
     - `Play Icon.png` - Play button icon
     - `Skip Icon.png` - Skip button icon
     - `Muted Icon.png` - Muted state icon
     - `Unmuted Icon.png` - Unmuted state icon
     - `Shuffle Icon.png` - Shuffle button icon

4. **Add Sound Effect** (Optional):
   - Place `Music.mp3` in `Sound Effects/` folder for button click sound

5. **Deploy to GitHub Pages** (Recommended):
   - Push your code to a GitHub repository
   - Go to Settings → Pages
   - Select your branch and `/` (root) folder
   - Your site will be available at `https://yourusername.github.io/repository-name/`
   
   **Or run locally**:
   - Use a local server: `python -m http.server 8000` or `npx serve`
   - Open `http://localhost:8000` in your browser

## File Structure

```
Tenna Soundboard/
├── index.html              # Main HTML file
├── styles.css              # Mobile-optimized styles
├── script.js               # Music panel functionality
├── manifest.json           # Music & sound effects list (auto-generated)
├── app-manifest.json       # PWA manifest for app installation
├── generate-manifest.js    # Script to generate manifest.json
├── .nojekyll               # GitHub Pages configuration
├── Music/                  # Music files (.mp3, .wav, .ogg)
├── Music Icons/            # Music track icons (.png)
├── Sound Effect Icons/     # Sound effect icons (.png)
├── Icons/                  # Control button icons (.png)
└── Sound Effects/          # Sound effects organized by category (.mp3)
    ├── Attack or Roleplay/
    ├── During Photos/
    └── Weird Interactions/
```

## Usage

1. **Music**: Click any song from the grid to play it. Click again to stop.
2. **Sound Effects**: Click any sound effect button to play it. Click again to stop (button turns green while playing).
3. **Controls**:
   - **Pause/Play**: Toggle playback
   - **Skip**: Play next song
   - **Mute**: Mute/unmute audio
   - **Shuffle**: Enable shuffle mode
   - **Loop**: Enable/disable looping
4. **Volume**: Adjust music and sound effects volume with separate sliders
5. **Progress Bar**: Drag to seek through the song (won't restart on drag)
6. **Search**: Type in the search bar to filter music and sound effects

## Mobile Features

- **Large Touch Targets**: Minimum 56-60px for easy tapping
- **Full Screen**: Takes up entire screen for immersive experience
- **PWA Support**: Install as an app on your home screen
- **Optimized Layout**: Responsive grid (6 columns on mobile, up to 15 on large screens)
- **Touch Optimized**: Progress bar and sliders work smoothly on touch devices
- **Portrait & Landscape**: Optimized for both orientations
- **No Text Selection**: Prevents accidental text selection while interacting

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## Notes

- **State Persistence**: Music state (current song, position, volume, shuffle, loop) is saved to `localStorage`
- **Default Volume**: Music starts at 50% volume
- **No Auto-Play**: Music doesn't auto-play on load (requires user interaction)
- **Cache Busting**: Audio files use cache-busting to ensure updated files are loaded
- **Volume Multipliers**: Some sound effects (TV Off, Fun Meter, etc.) are automatically louder
- **Icon Matching**: Sound effect icons are automatically matched even if names don't match exactly

## GitHub Pages Deployment

1. Create a new repository on GitHub
2. Push all files to the repository
3. Go to Settings → Pages
4. Select your branch (usually `main` or `master`)
5. Select `/` (root) as the source folder
6. Click Save
7. Your site will be live at `https://yourusername.github.io/repository-name/`

The `.nojekyll` file ensures GitHub Pages serves your files correctly without Jekyll processing.

