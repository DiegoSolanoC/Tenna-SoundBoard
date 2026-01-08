// Sound Effects Manager (simplified for music button sound)
window.SoundEffectsManager = {
    sounds: {},
    volume: 0.5, // Default 50%
    currentlyPlaying: {}, // Track currently playing sound effects
    cacheBuster: Date.now(), // Cache-busting timestamp to force reload of updated files
    
    // Volume multipliers for specific sound effects (to make them louder)
    volumeMultipliers: {
        'tv_off': 3.0,
        'fun_meter': 3.0,
        'you_are_taking_too_long': 3.0,
        'you_found_moss': 3.0,
        'gaster': 1.8,
        'lancer': 1.8,
        'weird_route_short': 1.8
    },
    
    // Load saved volume from localStorage
    loadVolume() {
        const savedVolume = localStorage.getItem('soundEffectsVolume');
        if (savedVolume !== null) {
            const volume = parseFloat(savedVolume);
            if (!isNaN(volume) && volume >= 0 && volume <= 1) {
                this.volume = volume;
            }
        }
        return this.volume;
    },
    
    // Save volume to localStorage
    saveVolume() {
        localStorage.setItem('soundEffectsVolume', this.volume.toString());
    },
    
    // Load a sound effect
    loadSound(name, path) {
        try {
            // Add cache-busting parameter to force browser to reload updated files
            const separator = path.includes('?') ? '&' : '?';
            const cacheBustedPath = `${path}${separator}v=${this.cacheBuster}`;
            const audio = new Audio(cacheBustedPath);
            audio.preload = 'auto';
            audio.volume = this.volume;
            audio.addEventListener('error', (e) => {
                console.error(`Error loading sound "${name}" from "${path}":`, e);
            });
            this.sounds[name] = audio;
            return audio;
        } catch (error) {
            console.error(`Failed to create audio for "${name}":`, error);
            return null;
        }
    },
    
    // Play a sound effect (or stop if already playing)
    play(name, options = {}) {
        if (this.sounds[name]) {
            // If this sound is already playing, stop it
            if (this.currentlyPlaying[name]) {
                try {
                    this.currentlyPlaying[name].pause();
                    this.currentlyPlaying[name].currentTime = 0;
                } catch (e) {
                    // Ignore errors if audio is already stopped
                }
                delete this.currentlyPlaying[name];
                
                // Remove playing class from button
                const btn = document.querySelector(`.sound-effect-btn[data-sound-name="${name}"]`);
                if (btn) {
                    btn.classList.remove('playing');
                }
                
                return null;
            }
            
            const audio = this.sounds[name].cloneNode();
            audio.currentTime = 0;
            
            if (options.playbackRate) {
                audio.playbackRate = options.playbackRate;
            }
            
            // Apply volume multiplier if this sound has one
            const multiplier = this.volumeMultipliers[name] || 1.0;
            audio.volume = Math.min(1.0, this.volume * multiplier);
            
            // Track this audio instance
            this.currentlyPlaying[name] = audio;
            
            // Add playing class to button
            const btn = document.querySelector(`.sound-effect-btn[data-sound-name="${name}"]`);
            if (btn) {
                btn.classList.add('playing');
            }
            
            // Remove from tracking and update button when it ends
            audio.addEventListener('ended', () => {
                delete this.currentlyPlaying[name];
                const btn = document.querySelector(`.sound-effect-btn[data-sound-name="${name}"]`);
                if (btn) {
                    btn.classList.remove('playing');
                }
            });
            
            const playAudio = () => {
                audio.play().catch(err => {
                    console.warn(`Could not play sound effect "${name}":`, err);
                    delete this.currentlyPlaying[name];
                    const btn = document.querySelector(`.sound-effect-btn[data-sound-name="${name}"]`);
                    if (btn) {
                        btn.classList.remove('playing');
                    }
                });
            };
            
            if (audio.readyState >= 2) {
                playAudio();
            } else {
                const readyHandler = () => {
                    playAudio();
                    audio.removeEventListener('canplay', readyHandler);
                };
                audio.addEventListener('canplay', readyHandler);
                setTimeout(() => {
                    if (audio.readyState >= 2) {
                        playAudio();
                    }
                    audio.removeEventListener('canplay', readyHandler);
                }, 50);
            }
            
            return audio;
        } else {
            console.warn(`Sound effect "${name}" not loaded`);
            return null;
        }
    },
    
    // Set volume for all sound effects
    setVolume(volume) {
        this.volume = volume;
        this.saveVolume();
        Object.keys(this.sounds).forEach(name => {
            this.sounds[name].volume = volume;
        });
    },
    
    // Initialize sound effects
    init() {
        // Load music button sound (optional - will fail gracefully if file doesn't exist)
        try {
            this.loadSound('music', 'Sound Effects/Music.mp3');
        } catch (e) {
            console.log('Music sound effect not available (optional)');
        }
        
        // Load saved volume and apply it
        const savedVolume = this.loadVolume();
        this.setVolume(savedVolume);
        
        // Setup sound effects volume slider
        const soundEffectsSlider = document.getElementById('soundEffectsSlider');
        const soundEffectsVolumeValue = document.getElementById('soundEffectsVolumeValue');
        
        if (soundEffectsSlider && soundEffectsVolumeValue) {
            soundEffectsSlider.value = Math.round(savedVolume * 100);
            soundEffectsVolumeValue.textContent = Math.round(savedVolume * 100) + '%';
            
            soundEffectsSlider.addEventListener('input', function() {
                const volume = this.value / 100;
                window.SoundEffectsManager.setVolume(volume);
                soundEffectsVolumeValue.textContent = this.value + '%';
            });
        }
    }
};

// Asset loading order tracking
const assetLoadOrder = [];
const logAssetLoad = (assetType, assetName) => {
    const timestamp = performance.now().toFixed(2);
    const entry = `[${timestamp}ms] ${assetType}: ${assetName}`;
    assetLoadOrder.push(entry);
    console.log(entry);
};

// Music Panel functionality
let musicPanelInitialized = false;

function initMusicPanel() {
    if (musicPanelInitialized) {
        console.log('Music panel already initialized, skipping...');
        return;
    }
    
    const musicPanel = document.getElementById('musicPanel');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const muteBtn = document.getElementById('muteBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const skipBtn = document.getElementById('skipBtn');
    const musicGrid = document.getElementById('musicGrid');
    
    if (!musicPanel || !backgroundMusic || !musicGrid) {
        console.error('Missing required elements:', { musicPanel, backgroundMusic, musicGrid });
        return;
    }
    
    musicPanelInitialized = true;
    
    // PRIORITY: Load saved music state FIRST
    const savedState = localStorage.getItem('musicState');
    let prioritySong = null;
    // Always default to 50% volume - only use saved volume if it's > 0
    let initialVolume = 0.5; // Default 50%
    
    if (savedState) {
        try {
            const musicState = JSON.parse(savedState);
            if (musicState.currentSong) {
                prioritySong = musicState.currentSong;
                logAssetLoad('MUSIC_PRIORITY', `Priority loading: ${prioritySong}`);
            }
            // Only use saved volume if it's greater than 0, otherwise default to 0.5
            if (musicState.volume !== undefined && musicState.volume > 0) {
                initialVolume = musicState.volume;
            } else {
                // Ensure default is 0.5 if saved volume is 0 or undefined
                initialVolume = 0.5;
                // Clear the bad volume from localStorage
                if (musicState.volume === 0) {
                    musicState.volume = 0.5;
                    localStorage.setItem('musicState', JSON.stringify(musicState));
                }
            }
        } catch (e) {
            // Use defaults if parse fails
            initialVolume = 0.5;
        }
    }
    
    window.prioritySong = prioritySong;
    
    let currentSong = null;
    let musicFiles = [];
    let isShuffling = false;
    let shuffleQueue = [];
    let currentSongIndex = 0;
    let isDragging = false;
    let currentTargetVolume = initialVolume;
    
    // Force volume to 50% if it's 0 or undefined
    if (initialVolume <= 0 || isNaN(initialVolume)) {
        initialVolume = 0.5;
        currentTargetVolume = 0.5;
    }
    
    backgroundMusic.volume = initialVolume;
    if (volumeSlider) volumeSlider.value = Math.round(initialVolume * 100);
    if (volumeValue) volumeValue.textContent = Math.round(initialVolume * 100) + '%';
    
    // Cache-busting timestamp for music files (updates on page load)
    const musicCacheBuster = Date.now();
    
    // Helper function to encode music file paths with cache-busting
    const encodeMusicPath = (path) => {
        if (!path) return path;
        const parts = path.split('/');
        let encodedPath;
        if (parts.length === 2) {
            const folder = parts[0];
            const filename = parts[1];
            encodedPath = `${folder}/${encodeURIComponent(filename)}`;
        } else {
            encodedPath = path;
        }
        // Add cache-busting parameter
        const separator = encodedPath.includes('?') ? '&' : '?';
        return `${encodedPath}${separator}v=${musicCacheBuster}`;
    };

    const playMusic = (songPath = null) => {
        if (songPath) {
            // Set loop based on loop button state (not shuffle)
            backgroundMusic.loop = isLooping;
            
            const progressBar = document.getElementById('musicProgressBar');
            if (progressBar) {
                progressBar.value = 0;
            }
            
            const encodedPath = encodeMusicPath(songPath);
            backgroundMusic.src = encodedPath;
            currentSong = songPath;
            updateNowPlaying();
            
            // Add error handler for file loading issues (case sensitivity on GitHub Pages)
            const handleLoadError = () => {
                console.error(`❌ Failed to load music file: ${encodedPath}`);
                console.error(`   Attempted path: ${songPath}`);
                console.error(`   This is likely a case sensitivity issue on GitHub Pages.`);
                console.error(`   Please verify the file name on GitHub matches exactly: ${songPath.split('/').pop()}`);
            };
            backgroundMusic.addEventListener('error', handleLoadError, { once: true });
            
            // Update selected button
            document.querySelectorAll('.music-grid-btn').forEach(btn => {
                btn.classList.remove('selected');
                const btnPath = btn.dataset.songPath;
                if (btnPath === songPath || 
                    btnPath === songPath.replace(/ /g, '%20') ||
                    btnPath.replace(/ /g, '%20') === songPath ||
                    decodeURIComponent(btnPath) === decodeURIComponent(songPath)) {
                    btn.classList.add('selected');
                }
            });
            
            backgroundMusic.load();
            
            // Handler for metadata loaded
            const handleMetadataLoaded = (eventType) => {
                const duration = backgroundMusic.duration;
                
                if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                    updateProgressBar();
                    if (progressBar) {
                        progressBar.value = 0;
                    }
                    backgroundMusic.removeEventListener('loadedmetadata', handleMetadataLoaded);
                    backgroundMusic.removeEventListener('canplay', handleMetadataLoaded);
                    backgroundMusic.removeEventListener('loadeddata', handleMetadataLoaded);
                    backgroundMusic.removeEventListener('canplaythrough', handleMetadataLoaded);
                }
            };
            
            backgroundMusic.addEventListener('loadedmetadata', () => handleMetadataLoaded('loadedmetadata'));
            backgroundMusic.addEventListener('canplay', () => handleMetadataLoaded('canplay'));
            backgroundMusic.addEventListener('loadeddata', () => handleMetadataLoaded('loadeddata'));
            backgroundMusic.addEventListener('canplaythrough', () => handleMetadataLoaded('canplaythrough'));
            
            // Fallback: Check periodically
            let metadataCheckCount = 0;
            const maxMetadataChecks = 100;
            const metadataCheckInterval = setInterval(() => {
                metadataCheckCount++;
                const duration = backgroundMusic.duration;
                
                if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                    updateProgressBar();
                    if (progressBar) {
                        progressBar.value = 0;
                    }
                    clearInterval(metadataCheckInterval);
                } else if (metadataCheckCount >= maxMetadataChecks) {
                    clearInterval(metadataCheckInterval);
                }
            }, 100);
        }
        
        const encodedPath = encodeMusicPath(songPath);
        if (!backgroundMusic.paused && backgroundMusic.src.endsWith(encodedPath.split('/').pop())) return;
        
        // Set volume directly (no fade)
        backgroundMusic.volume = backgroundMusic.muted ? 0 : currentTargetVolume;
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                updateProgressBar();
            }).catch(error => {
                console.log('Autoplay prevented:', error);
            });
        } else {
            updateProgressBar();
        }
    };
    
    // Shuffle function
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // Play next song
    function playNextSong() {
        if (isShuffling && shuffleQueue.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % shuffleQueue.length;
            playMusic(`Music/${shuffleQueue[currentSongIndex].filename}`);
        } else {
            if (musicFiles.length === 0) return;
            const winstonsDesk = musicFiles.find(s => s.name.toLowerCase().includes('winston') || s.name.toLowerCase().includes('desk'));
            if (winstonsDesk) {
                playMusic(`Music/${winstonsDesk.filename}`);
            } else {
                playMusic(`Music/${musicFiles[0].filename}`);
            }
        }
    }
    
    window.encodeMusicPath = encodeMusicPath;
    
    // Handle song end
    backgroundMusic.addEventListener('ended', () => {
        // Note: If backgroundMusic.loop is true, this event shouldn't fire
        // But we handle it here as a fallback
        if (isShuffling && shuffleQueue.length > 0) {
            playNextSong();
        } else if (isLooping && currentSong) {
            // Manual loop - restart the current song
            backgroundMusic.currentTime = 0;
            backgroundMusic.play().catch(err => {
                console.warn('Could not restart looped song:', err);
            });
        } else {
            // When shuffle and loop are off, just stop
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
            currentSong = null;
            updateNowPlaying();
            // Clear selected button
            document.querySelectorAll('.music-grid-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
        }
    });
    
    // Shuffle button
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', function() {
            isShuffling = !isShuffling;
            
            if (isShuffling) {
                shuffleQueue = shuffleArray(musicFiles);
                currentSongIndex = shuffleQueue.findIndex(s => `Music/${s.filename}` === currentSong);
                if (currentSongIndex === -1) currentSongIndex = 0;
                this.classList.add('active');
            } else {
                shuffleQueue = [];
                this.classList.remove('active');
            }
            saveMusicState();
        });
    }
    
    // Loop button
    let isLooping = false;
    const loopBtn = document.getElementById('loopBtn');
    const loopBtnIcon = document.getElementById('loopBtnIcon');
    if (loopBtn) {
        // Check saved loop state
        const savedLoopState = localStorage.getItem('musicLoopState');
        if (savedLoopState === 'true') {
            isLooping = true;
            loopBtn.classList.add('active');
            // Set loop property immediately when restoring state
            backgroundMusic.loop = true;
        } else {
            // Ensure loop is false if not saved or explicitly false
            backgroundMusic.loop = false;
        }
        
        loopBtn.addEventListener('click', function() {
            isLooping = !isLooping;
            
            if (isLooping) {
                this.classList.add('active');
            } else {
                this.classList.remove('active');
            }
            
            // Always set the loop property when toggling, even if no song is playing
            // This ensures it's set correctly when a song starts
            backgroundMusic.loop = isLooping;
            
            localStorage.setItem('musicLoopState', isLooping.toString());
            saveMusicState();
        });
    }
    
    // Get current song name
    function getCurrentSongName() {
        if (!currentSong) return 'No song playing';
        const song = musicFiles.find(s => `Music/${s.filename}` === currentSong);
        return song ? song.name : 'Unknown';
    }
    
    // Update now playing display
    function updateNowPlaying() {
        const currentSongEl = document.getElementById('musicCurrentSong');
        if (currentSongEl) {
            currentSongEl.textContent = getCurrentSongName();
        }
    }
    
    // Update progress bar
    function updateProgressBar() {
        const progressBar = document.getElementById('musicProgressBar');
        const currentTimeEl = document.getElementById('musicCurrentTime');
        const totalTimeEl = document.getElementById('musicTotalTime');
        
        if (!backgroundMusic || !backgroundMusic.duration || isNaN(backgroundMusic.duration) || !isFinite(backgroundMusic.duration) || backgroundMusic.duration <= 0) {
            if (currentTimeEl && backgroundMusic && !isNaN(backgroundMusic.currentTime)) {
                currentTimeEl.textContent = formatTime(backgroundMusic.currentTime);
            }
            if (totalTimeEl) {
                totalTimeEl.textContent = '0:00';
            }
            return;
        }
        
        const current = backgroundMusic.currentTime;
        const total = backgroundMusic.duration;
        const percent = (current / total) * 100;
        
        if (progressBar && !isSeeking && !isDragging) {
            progressBar.value = percent;
        }
        
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(current);
        }
        
        if (totalTimeEl) {
            totalTimeEl.textContent = formatTime(total);
        }
    }
    
    // Format time as MM:SS
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Progress bar interaction
    const progressBar = document.getElementById('musicProgressBar');
    let isSeeking = false;
    let wasDragging = false;
    let mouseDownX = 0;
    
    if (progressBar) {
        progressBar.addEventListener('mousedown', (e) => {
            isSeeking = true;
            isDragging = true;
            wasDragging = false;
            mouseDownX = e.clientX;
        });
        
        progressBar.addEventListener('mousemove', (e) => {
            if (isDragging) {
                wasDragging = true;
                if (backgroundMusic && !backgroundMusic.paused) {
                    const duration = backgroundMusic.duration;
                    if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                        const rect = progressBar.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                        const newTime = (percent / 100) * duration;
                        backgroundMusic.currentTime = newTime;
                    }
                }
            }
        });
        
        progressBar.addEventListener('click', (e) => {
            // Only handle click if it wasn't a drag
            if (!wasDragging && backgroundMusic) {
                const duration = backgroundMusic.duration;
                
                if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                    const rect = progressBar.getBoundingClientRect();
                    const percent = ((e.clientX - rect.left) / rect.width) * 100;
                    const newTime = (Math.max(0, Math.min(100, percent)) / 100) * duration;
                    backgroundMusic.currentTime = newTime;
                    updateProgressBar();
                }
            }
            wasDragging = false;
        });
        
        progressBar.addEventListener('mouseup', () => {
            isSeeking = false;
            isDragging = false;
            wasDragging = false;
        });
        
        progressBar.addEventListener('mouseleave', () => {
            if (isDragging) {
                isSeeking = false;
                isDragging = false;
                wasDragging = false;
            }
        });
        
        progressBar.addEventListener('input', function() {
            if (backgroundMusic && (isSeeking || isDragging)) {
                const duration = backgroundMusic.duration;
                
                if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                    const percent = this.value;
                    const newTime = (percent / 100) * duration;
                    backgroundMusic.currentTime = newTime;
                }
            }
        });
        
        progressBar.addEventListener('change', function() {
            if (backgroundMusic) {
                const duration = backgroundMusic.duration;
                
                if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                    const percent = this.value;
                    const newTime = (percent / 100) * duration;
                    backgroundMusic.currentTime = newTime;
                    updateProgressBar();
                }
            }
            isSeeking = false;
            isDragging = false;
            wasDragging = false;
        });
        
        // Touch events for mobile
        let touchStartX = 0;
        progressBar.addEventListener('touchstart', (e) => {
            isSeeking = true;
            isDragging = true;
            wasDragging = false;
            touchStartX = e.touches[0].clientX;
        });
        
        progressBar.addEventListener('touchmove', (e) => {
            if (isDragging && backgroundMusic && !backgroundMusic.paused) {
                wasDragging = true;
                const duration = backgroundMusic.duration;
                if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                    const rect = progressBar.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
                    const newTime = (percent / 100) * duration;
                    backgroundMusic.currentTime = newTime;
                }
            }
        });
        
        progressBar.addEventListener('touchend', () => {
            isSeeking = false;
            isDragging = false;
            wasDragging = false;
        });
    }
    
    // Update progress on timeupdate
    let musicStateSaveTimeout = null;
    backgroundMusic.addEventListener('timeupdate', () => {
        if (!isDragging && !isSeeking) {
            updateProgressBar();
        }
        if (!musicStateSaveTimeout) {
            musicStateSaveTimeout = setTimeout(() => {
                saveMusicState();
                musicStateSaveTimeout = null;
            }, 1000);
        }
    });
    
    // Save state before page unload
    window.addEventListener('beforeunload', () => {
        if (window.saveMusicState) {
            window.saveMusicState();
        }
    });
    
    // Save music state to localStorage
    const saveMusicState = () => {
        if (!backgroundMusic) return;
        const musicState = {
            currentSong: currentSong,
            currentTime: backgroundMusic.currentTime,
            paused: backgroundMusic.paused,
            volume: backgroundMusic.volume,
            muted: backgroundMusic.muted,
            isShuffling: isShuffling,
            currentSongIndex: currentSongIndex,
            shuffleQueue: isShuffling ? shuffleQueue.map(s => s.filename) : null
        };
        localStorage.setItem('musicState', JSON.stringify(musicState));
    };
    
    window.saveMusicState = saveMusicState;
    
    // Restore music state from localStorage
    const restoreMusicState = () => {
        const savedState = localStorage.getItem('musicState');
        if (!savedState) return false;
        
        try {
            const musicState = JSON.parse(savedState);
            
            if (musicState.isShuffling && musicState.shuffleQueue && musicFiles.length > 0) {
                isShuffling = true;
                shuffleQueue = musicFiles.filter(s => musicState.shuffleQueue.includes(s.filename));
                currentSongIndex = musicState.currentSongIndex || 0;
                if (shuffleBtn) {
                    shuffleBtn.classList.add('active');
                }
            }
            
            // Always default to 50% if volume is 0 or undefined
            if (musicState.volume !== undefined && musicState.volume > 0) {
                backgroundMusic.volume = musicState.volume;
                currentTargetVolume = musicState.volume;
                if (volumeSlider) volumeSlider.value = Math.round(musicState.volume * 100);
                if (volumeValue) volumeValue.textContent = Math.round(musicState.volume * 100) + '%';
            } else {
                // Force to 50% if saved volume is 0 or undefined
                backgroundMusic.volume = 0.5;
                currentTargetVolume = 0.5;
                if (volumeSlider) volumeSlider.value = 50;
                if (volumeValue) volumeValue.textContent = '50%';
                // Update saved state to fix it
                musicState.volume = 0.5;
                localStorage.setItem('musicState', JSON.stringify(musicState));
            }
            
            if (musicState.muted !== undefined) {
                backgroundMusic.muted = musicState.muted;
                updateMuteIcon(musicState.muted);
                if (muteBtn) {
                    if (musicState.muted) {
                        muteBtn.classList.add('active');
                    } else {
                        muteBtn.classList.remove('active');
                    }
                }
            }
            
            if (musicState.currentSong && musicFiles.length > 0) {
                const songToRestore = musicFiles.find(s => {
                    const songPath = `Music/${s.filename}`;
                    return songPath === musicState.currentSong || 
                           songPath.replace(/ /g, '%20') === musicState.currentSong;
                });
                
                if (songToRestore) {
                    currentSong = `Music/${songToRestore.filename}`;
                    
                    const encodedPath = encodeMusicPath(currentSong);
                    backgroundMusic.src = encodedPath;
                    backgroundMusic.loop = isLooping; // Loop if loop button is active
                    backgroundMusic.load();
                    
                    updateNowPlaying();
                    document.querySelectorAll('.music-grid-btn').forEach(btn => {
                        btn.classList.remove('selected');
                        const btnPath = btn.dataset.songPath;
                        if (btnPath === currentSong || 
                            btnPath === currentSong.replace(/ /g, '%20') ||
                            btnPath.replace(/ /g, '%20') === currentSong ||
                            decodeURIComponent(btnPath) === decodeURIComponent(currentSong)) {
                            btn.classList.add('selected');
                        }
                    });
                    
                    const restorePosition = () => {
                        if (backgroundMusic.readyState >= 2) {
                            if (musicState.currentTime !== undefined && musicState.currentTime > 0) {
                                backgroundMusic.currentTime = musicState.currentTime;
                            }
                            
                            if (musicState.paused) {
                                backgroundMusic.pause();
                                updatePauseIcon(true);
                                if (pauseBtn) pauseBtn.classList.add('active');
                            } else {
                                setTimeout(() => {
                                    const playPromise = backgroundMusic.play();
                                    if (playPromise !== undefined) {
                                        playPromise.then(() => {
                                            updatePauseIcon(false);
                                            if (pauseBtn) pauseBtn.classList.remove('active');
                                        }).catch(error => {
                                            console.log('Autoplay prevented on restore:', error);
                                            backgroundMusic.pause();
                                            updatePauseIcon(true);
                                            if (pauseBtn) pauseBtn.classList.add('active');
                                        });
                                    }
                                }, 100);
                            }
                            
                            backgroundMusic.removeEventListener('loadedmetadata', restorePosition);
                            backgroundMusic.removeEventListener('canplay', restorePosition);
                        }
                    };
                    
                    backgroundMusic.addEventListener('loadedmetadata', restorePosition);
                    backgroundMusic.addEventListener('canplay', restorePosition);
                    
                    setTimeout(() => {
                        if (backgroundMusic.readyState >= 2) {
                            if (musicState.currentTime !== undefined && musicState.currentTime > 0) {
                                backgroundMusic.currentTime = musicState.currentTime;
                            }
                            if (musicState.paused) {
                                backgroundMusic.pause();
                                updatePauseIcon(true);
                                if (pauseBtn) pauseBtn.classList.add('active');
                            } else {
                                backgroundMusic.play().catch(() => {
                                    console.log('Autoplay prevented on restore (fallback)');
                                });
                            }
                        }
                    }, 1000);
                    
                    return true;
                }
            }
            
            return false;
        } catch (e) {
            console.error('Error restoring music state:', e);
            return false;
        }
    };
    
    // Load music files from manifest
    async function loadMusicFiles() {
        try {
            logAssetLoad('MUSIC', 'Loading manifest.json');
            const cacheBuster = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const response = await fetch(`manifest.json?v=${cacheBuster}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const manifest = await response.json();
            logAssetLoad('MUSIC', `manifest.json loaded (${manifest.music ? manifest.music.length : 0} music files)`);
            
            if (manifest.music && manifest.music.length > 0) {
                musicFiles = manifest.music;
                console.log(`✓ Loaded ${musicFiles.length} music files from manifest:`, musicFiles.map(s => s.name));
                console.log('Music files array:', musicFiles);
                console.log('musicGrid element:', musicGrid);
                console.log('About to call createMusicButtons...');
                
                // PRIORITY: Preload current song FIRST
                const currentPrioritySong = window.prioritySong || null;
                if (currentPrioritySong) {
                    const prioritySongFile = musicFiles.find(s => {
                        const songPath = `Music/${s.filename}`;
                        return songPath === currentPrioritySong || songPath.replace(/ /g, '%20') === currentPrioritySong;
                    });
                    if (prioritySongFile) {
                        logAssetLoad('MUSIC_PRIORITY', `Preloading current song: ${prioritySongFile.filename}`);
                        const encodedPath = encodeMusicPath(`Music/${prioritySongFile.filename}`);
                        const priorityAudio = new Audio(encodedPath);
                        priorityAudio.preload = 'auto';
                        priorityAudio.load();
                    }
                }
                
                musicFiles.forEach(song => {
                    logAssetLoad('MUSIC_FILE', `${song.filename} (${song.name})`);
                });
                
                console.log('Calling createMusicButtons() now...');
                console.log('musicGrid before createMusicButtons:', musicGrid);
                createMusicButtons();
                console.log('createMusicButtons() completed');
                console.log('musicGrid after createMusicButtons, children count:', musicGrid ? musicGrid.children.length : 'musicGrid is null');
                
                // Preload all music files
                musicFiles.forEach(song => {
                    const encodedPath = encodeMusicPath(`Music/${song.filename}`);
                    const audio = new Audio(encodedPath);
                    audio.preload = 'auto';
                    const iconName = song.filename.replace(/\.(mp3|wav|ogg)$/i, '');
                    const iconImg = new Image();
                    const imageCacheBuster = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const encodedIconName = encodeURIComponent(iconName);
                    iconImg.src = `Music Icons/${encodedIconName}.png?v=${imageCacheBuster}`;
                });
                
                const restored = restoreMusicState();
                if (restored) {
                    logAssetLoad('MUSIC_PRIORITY', 'Music state restored successfully');
                }
                // Don't auto-play - user must click a song to start
            } else {
                console.warn('No music files found in manifest.json');
                if (musicGrid) {
                    musicGrid.innerHTML = '<div style="color: #ff6600; padding: 20px; text-align: center;">No music files found.<br><br>1. Add files to Music folder<br>2. Add icons to Music Icons folder<br>3. Run: node generate-manifest.js<br>4. Refresh page</div>';
                }
            }
            
            // Load sound effects if available
            if (manifest.soundEffects && manifest.soundEffects.length > 0) {
                loadSoundEffects(manifest.soundEffects);
            }
        } catch (error) {
            console.error('Error loading manifest.json:', error);
            console.error('Full error details:', error.message);
            
            // Try to load manifest using a different method for file:// protocol
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.log('Attempting to load manifest using XMLHttpRequest as fallback...');
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', 'manifest.json', false); // Synchronous for file://
                    xhr.send();
                    if (xhr.status === 200 || xhr.status === 0) { // 0 for file://
                        const manifest = JSON.parse(xhr.responseText);
                        if (manifest.music && manifest.music.length > 0) {
                            musicFiles = manifest.music;
                            console.log(`Loaded ${musicFiles.length} music files via XHR fallback`);
                            createMusicButtons();
                            
                            // Load sound effects if available
                            if (manifest.soundEffects && manifest.soundEffects.length > 0) {
                                loadSoundEffects(manifest.soundEffects);
                            }
                            
                            const restored = restoreMusicState();
                            // Don't auto-play - user must click a song to start
                            return;
                        }
                    }
                } catch (xhrError) {
                    console.error('XHR fallback also failed:', xhrError);
                }
            }
            
            if (musicGrid) {
                musicGrid.innerHTML = `<div style="color: #ff6600; padding: 20px; text-align: center; font-size: 14px;">Error loading music manifest.<br><br><strong>Error:</strong> ${error.message}<br><br><strong>Solution:</strong><br>Please ensure you are accessing this page through a web server (not file:// protocol).<br><br>If running locally, use:<br>• Python: <code>python -m http.server 8000</code><br>• Node: <code>npx serve</code><br>• VS Code: Use Live Server extension</div>`;
            }
        }
    }
    
    // Create music buttons - must be defined inside initMusicPanel to access musicGrid
    function createMusicButtons() {
        console.log('=== createMusicButtons() START ===');
        console.log('musicFiles count:', musicFiles.length);
        console.log('musicGrid element:', musicGrid);
        console.log('musicGrid exists?', !!musicGrid);
        
        // Re-get musicGrid in case it wasn't found earlier
        const gridElement = document.getElementById('musicGrid') || musicGrid;
        if (!gridElement) {
            console.error('❌ musicGrid element not found in DOM!');
            console.error('Searched for element with id="musicGrid"');
            return;
        }
        
        // Use the grid element (either from outer scope or re-queried)
        const grid = gridElement;
        
        console.log('Clearing grid innerHTML...');
        grid.innerHTML = '';
        
        if (musicFiles.length === 0) {
            console.warn('⚠ No music files to display!');
            grid.innerHTML = '<div style="color: #ff6600; padding: 20px; text-align: center;">No music files found in manifest.</div>';
            return;
        }
        
        console.log(`Creating ${musicFiles.length} music buttons...`);
        musicFiles.forEach((song, index) => {
            console.log(`[${index + 1}/${musicFiles.length}] Creating button for:`, song.name, song.filename);
            
            const musicBtn = document.createElement('div');
            musicBtn.className = 'music-grid-btn';
            musicBtn.dataset.songPath = `Music/${song.filename}`;
            musicBtn.dataset.songName = song.name;
            
            // Image container
            const imageContainer = document.createElement('div');
            imageContainer.className = 'music-icon-container';
            
            const img = document.createElement('img');
            const iconName = song.filename.replace(/\.(mp3|wav|ogg)$/i, '');
            const imageCacheBuster = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const encodedIconName = encodeURIComponent(iconName);
            img.src = `Music Icons/${encodedIconName}.png?v=${imageCacheBuster}`;
            img.alt = song.name;
            let iconLoadAttempts = 0;
            img.onerror = function() {
                iconLoadAttempts++;
                // Try alternative encodings first
                if (iconLoadAttempts === 1) {
                    const altEncoded = iconName.replace(/\s+/g, '%20');
                    this.src = `Music Icons/${altEncoded}.png?v=${imageCacheBuster}`;
                    return;
                }
                // Try uppercase "TV" specifically (for "Tv World" -> "TV World")
                if (iconLoadAttempts === 2) {
                    const tvUppercase = iconName.replace(/^tv /i, 'TV ').replace(/ tv /i, ' TV ');
                    if (tvUppercase !== iconName) {
                        const varEncoded = encodeURIComponent(tvUppercase);
                        this.src = `Music Icons/${varEncoded}.png?v=${imageCacheBuster}`;
                        return;
                    }
                }
                // Try full uppercase as last resort
                if (iconLoadAttempts === 3) {
                    const upperEncoded = encodeURIComponent(iconName.toUpperCase());
                    this.src = `Music Icons/${upperEncoded}.png?v=${imageCacheBuster}`;
                    return;
                }
                // If all attempts fail, hide the icon
                this.style.display = 'none';
            };
            
            imageContainer.appendChild(img);
            
            // Label
            const label = document.createElement('div');
            label.className = 'music-label';
            label.textContent = song.name;
            
            musicBtn.appendChild(imageContainer);
            musicBtn.appendChild(label);
            
            // Check if this is the current song
            const songPath = `Music/${song.filename}`;
            if (currentSong === songPath || 
                currentSong === songPath.replace(/ /g, '%20') ||
                (currentSong && currentSong.replace(/ /g, '%20') === songPath) ||
                (currentSong && decodeURIComponent(currentSong) === decodeURIComponent(songPath))) {
                musicBtn.classList.add('selected');
            }
            
            // Click handler - play the song or stop if already playing
            musicBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const songPath = this.dataset.songPath;
                
                console.log('Music button clicked:', songPath);
                
                // Check if this song is already playing
                const isCurrentlyPlaying = currentSong === songPath || 
                                         currentSong === songPath.replace(/ /g, '%20') ||
                                         (currentSong && currentSong.replace(/ /g, '%20') === songPath) ||
                                         (currentSong && decodeURIComponent(currentSong) === decodeURIComponent(songPath));
                
                if (isCurrentlyPlaying && !backgroundMusic.paused) {
                    // Song is playing - stop it
                    backgroundMusic.pause();
                    backgroundMusic.currentTime = 0;
                    currentSong = null;
                    this.classList.remove('selected');
                    updateNowPlaying();
                    saveMusicState();
                } else {
                    // Remove selected from all buttons
                    document.querySelectorAll('.music-grid-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // Add selected to clicked button
                    this.classList.add('selected');
                    
                    // Play the song
                    playMusic(songPath);
                    updateNowPlaying();
                    saveMusicState();
                }
            });
            
            // Also handle touch events for mobile
            musicBtn.addEventListener('touchend', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const songPath = this.dataset.songPath;
                
                console.log('Music button touched:', songPath);
                
                // Check if this song is already playing
                const isCurrentlyPlaying = currentSong === songPath || 
                                         currentSong === songPath.replace(/ /g, '%20') ||
                                         (currentSong && currentSong.replace(/ /g, '%20') === songPath) ||
                                         (currentSong && decodeURIComponent(currentSong) === decodeURIComponent(songPath));
                
                if (isCurrentlyPlaying && !backgroundMusic.paused) {
                    // Song is playing - stop it
                    backgroundMusic.pause();
                    backgroundMusic.currentTime = 0;
                    currentSong = null;
                    this.classList.remove('selected');
                    updateNowPlaying();
                    saveMusicState();
                } else {
                    document.querySelectorAll('.music-grid-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    this.classList.add('selected');
                    
                    playMusic(songPath);
                    updateNowPlaying();
                    saveMusicState();
                }
            });
            
            grid.appendChild(musicBtn);
            console.log(`  ✓ Button ${index + 1} appended to grid`);
        });
        
        console.log(`=== createMusicButtons() END ===`);
        console.log(`✓ Created ${musicFiles.length} music buttons in grid`);
        console.log('grid children count:', grid.children.length);
        console.log('grid.innerHTML length:', grid.innerHTML.length);
        console.log('grid computed style display:', window.getComputedStyle(grid).display);
        console.log('grid computed style visibility:', window.getComputedStyle(grid).visibility);
        console.log('grid offsetHeight:', grid.offsetHeight);
        console.log('grid offsetWidth:', grid.offsetWidth);
        
        // Force a reflow to ensure rendering
        void grid.offsetHeight;
        
        // Double-check: verify buttons are actually in the DOM
        const buttons = grid.querySelectorAll('.music-grid-btn');
        console.log('Found buttons in DOM:', buttons.length);
        if (buttons.length === 0 && musicFiles.length > 0) {
            console.error('❌ CRITICAL: Buttons were created but not found in DOM!');
            console.error('grid.innerHTML preview:', grid.innerHTML.substring(0, 500));
        } else {
            console.log('✅ SUCCESS: Music buttons are in the DOM!');
        }
    }
    
    // Load and create sound effects buttons (split into 3 sections by category)
    function loadSoundEffects(soundEffectsList) {
        console.log(`Loading ${soundEffectsList.length} sound effects...`);
        
        // Get the 3 grid containers
        const grid1 = document.getElementById('soundEffectsGrid1');
        const grid2 = document.getElementById('soundEffectsGrid2');
        const grid3 = document.getElementById('soundEffectsGrid3');
        
        if (!grid1 || !grid2 || !grid3) {
            console.warn('Sound effects grids not found');
            return;
        }
        
        // Group by category
        const category1 = [];
        const category2 = [];
        const category3 = [];
        
        soundEffectsList.forEach(soundEffect => {
            const category = soundEffect.category || 'Uncategorized';
            if (category === 'Attack or Roleplay') {
                category1.push(soundEffect);
            } else if (category === 'During Photos') {
                category2.push(soundEffect);
            } else if (category === 'Weird Interactions') {
                category3.push(soundEffect);
            }
        });
        
        // Helper function to create buttons in a grid
        const createButtonsInGrid = (soundEffects, grid) => {
            soundEffects.forEach(soundEffect => {
            // Load sound into SoundEffectsManager
            const soundPath = `Sound Effects/${soundEffect.filename}`;
            const soundKey = soundEffect.name.toLowerCase().replace(/\s+/g, '_');
            window.SoundEffectsManager.loadSound(soundKey, soundPath);
            
            // Create button
            const btn = document.createElement('div');
            btn.className = 'sound-effect-btn';
            btn.dataset.soundName = soundKey;
            
            // Check if icon exists (use icon from manifest if available, otherwise try to find it)
            let iconPath = null;
            if (soundEffect.icon) {
                iconPath = soundEffect.icon;
            } else {
                const iconName = soundEffect.filename.split('/').pop().replace(/\.(mp3|wav|ogg)$/i, '');
                iconPath = `Sound Effect Icons/${encodeURIComponent(iconName)}.png`;
            }
            
            const iconImg = document.createElement('img');
            iconImg.className = 'sound-effect-icon';
            iconImg.src = iconPath;
            iconImg.alt = soundEffect.name;
            iconImg.onerror = function() {
                // Icon doesn't exist, hide it
                this.style.display = 'none';
                btn.classList.remove('has-icon');
            };
            iconImg.onload = function() {
                // Icon exists, show it
                btn.classList.add('has-icon');
            };
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'sound-effect-name';
            nameDiv.textContent = soundEffect.name;
            
            btn.appendChild(iconImg);
            btn.appendChild(nameDiv);
            
            btn.addEventListener('click', function() {
                const soundName = this.dataset.soundName;
                const wasPlaying = this.classList.contains('playing');
                const audio = window.SoundEffectsManager.play(soundName);
                
                // Update button state
                if (wasPlaying) {
                    // Was playing, now stopped
                    this.classList.remove('playing');
                } else if (audio) {
                    // Now playing
                    this.classList.add('playing');
                    // Remove playing class when audio ends
                    audio.addEventListener('ended', function() {
                        btn.classList.remove('playing');
                    }, { once: true });
                }
            });
            
            grid.appendChild(btn);
            });
        };
        
        // Create buttons in each grid
        createButtonsInGrid(category1, grid1);
        createButtonsInGrid(category2, grid2);
        createButtonsInGrid(category3, grid3);
        
        console.log(`✓ Created ${soundEffectsList.length} sound effect buttons in 3 categories`);
    }
    
    // Search/Filter functionality
    function filterItems(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        // Filter music buttons
        const musicButtons = document.querySelectorAll('.music-grid-btn');
        musicButtons.forEach(btn => {
            const songName = btn.dataset.songName || '';
            if (term === '' || songName.toLowerCase().includes(term)) {
                btn.style.display = '';
            } else {
                btn.style.display = 'none';
            }
        });
        
        // Filter sound effect buttons (across all 3 grids)
        const soundEffectButtons = document.querySelectorAll('.sound-effect-btn');
        soundEffectButtons.forEach(btn => {
            const soundName = btn.querySelector('.sound-effect-name')?.textContent || '';
            if (term === '' || soundName.toLowerCase().includes(term)) {
                btn.style.display = '';
            } else {
                btn.style.display = 'none';
            }
        });
        
        // Also show/hide category sections if they have no visible items
        const categorySections = document.querySelectorAll('.sound-effect-category-section');
        categorySections.forEach(section => {
            const buttons = section.querySelectorAll('.sound-effect-btn');
            const hasVisible = Array.from(buttons).some(btn => btn.style.display !== 'none');
            section.style.display = hasVisible || term === '' ? '' : 'none';
        });
    }
    
    // Set up search input listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterItems(this.value);
        });
        
        // Also handle mobile keyboard events
        searchInput.addEventListener('keyup', function() {
            filterItems(this.value);
        });
    }
    
    backgroundMusic.load();
    
    let hasStartedPlaying = false;
    const playOnInteraction = () => {
        if (!hasStartedPlaying && backgroundMusic.paused && currentSong) {
            playMusic();
            hasStartedPlaying = true;
            interactionEvents.forEach(eventType => {
                document.removeEventListener(eventType, playOnInteraction);
            });
        }
    };
    
    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown', 'wheel'];
    interactionEvents.forEach(eventType => {
        document.addEventListener(eventType, playOnInteraction, { passive: true, once: false });
    });
    
    backgroundMusic.addEventListener('playing', () => {
        hasStartedPlaying = true;
        interactionEvents.forEach(eventType => {
            document.removeEventListener(eventType, playOnInteraction);
        });
    });
    
    // Panel is always visible - no toggle needed
    
    // Volume slider
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            currentTargetVolume = volume;
            
            if (!backgroundMusic.muted) {
                backgroundMusic.volume = volume;
            }
            
            if (volumeValue) {
                volumeValue.textContent = Math.round(volume * 100) + '%';
            }
            saveMusicState();
            
            if (volume === 0 && muteBtn) {
                muteBtn.classList.add('active');
                updateMuteIcon(true);
            } else if (muteBtn) {
                if (!backgroundMusic.muted) {
                    muteBtn.classList.remove('active');
                    updateMuteIcon(false);
                }
            }
        });
    }
    
    // Get icon elements (defined later, no need to declare here)
    
    // Function to update pause/play icon
    function updatePauseIcon(isPaused) {
        if (pauseBtnIcon) {
            pauseBtnIcon.src = isPaused ? 'Icons/Play Icon.png' : 'Icons/Pause Icon.png';
            pauseBtnIcon.alt = isPaused ? 'Play' : 'Pause';
        }
    }
    
    // Function to update mute/unmute icon
    function updateMuteIcon(isMuted) {
        if (muteBtnIcon) {
            muteBtnIcon.src = isMuted ? 'Icons/Muted Icon.png' : 'Icons/Unmuted Icon.png';
            muteBtnIcon.alt = isMuted ? 'Unmute' : 'Mute';
        }
    }
    
    // Mute button
    if (muteBtn) {
        muteBtn.addEventListener('click', function() {
            if (backgroundMusic.muted) {
                backgroundMusic.muted = false;
                this.classList.remove('active');
                updateMuteIcon(false);
                backgroundMusic.volume = currentTargetVolume;
            } else {
                backgroundMusic.muted = true;
                this.classList.add('active');
                updateMuteIcon(true);
            }
            saveMusicState();
        });
    }
    
    // Pause button
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
            if (backgroundMusic.paused) {
                backgroundMusic.play();
                this.classList.remove('active');
                updatePauseIcon(false);
            } else {
                backgroundMusic.pause();
                this.classList.add('active');
                updatePauseIcon(true);
            }
            saveMusicState();
        });
    }
    
    // Skip button
    if (skipBtn) {
        skipBtn.addEventListener('click', function() {
            playNextSong();
        });
    }
    
    backgroundMusic.addEventListener('play', () => {
        if (pauseBtn) {
            pauseBtn.classList.remove('active');
            updatePauseIcon(false);
        }
    });
    
    backgroundMusic.addEventListener('pause', () => {
        if (pauseBtn) {
            pauseBtn.classList.add('active');
            updatePauseIcon(true);
        }
    });
    
    // Initialize icons
    if (backgroundMusic.paused) {
        updatePauseIcon(true);
        if (pauseBtn) pauseBtn.classList.add('active');
    } else {
        updatePauseIcon(false);
        if (pauseBtn) pauseBtn.classList.remove('active');
    }
    
    if (backgroundMusic.muted) {
        updateMuteIcon(true);
        if (muteBtn) muteBtn.classList.add('active');
    } else {
        updateMuteIcon(false);
        if (muteBtn) muteBtn.classList.remove('active');
    }
    
    // Panel is always visible - no close on outside click needed
    
    // Load music files
    loadMusicFiles();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded fired ===');
    logAssetLoad('DOM', 'DOMContentLoaded event fired');
    
    // Initialize Sound Effects Manager
    if (window.SoundEffectsManager) {
        window.SoundEffectsManager.init();
    }
    
    // Initialize Music Panel
    console.log('Calling initMusicPanel()...');
    initMusicPanel();
    console.log('initMusicPanel() completed');
    
    // Verify musicGrid exists after initialization
    setTimeout(() => {
        const grid = document.getElementById('musicGrid');
        console.log('=== POST-INIT CHECK ===');
        console.log('musicGrid element:', grid);
        console.log('musicGrid children:', grid ? grid.children.length : 'N/A');
        console.log('musicGrid innerHTML length:', grid ? grid.innerHTML.length : 'N/A');
        if (grid && grid.children.length === 0) {
            console.error('⚠️ WARNING: musicGrid exists but has no children!');
            console.error('This means createMusicButtons() may not have run or failed silently.');
        }
    }, 1000);
    
    console.log('Tenna Soundboard initialized!');
});

