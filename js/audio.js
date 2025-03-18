 /**
 * Audio manager for handling game sound effects
 */
export class AudioManager {
    constructor() {
        // Audio context
        this.audioContext = null;
        
        // Sound effects
        this.sounds = {
            countdown: null,
            countdownGo: null,
            boost: null
        };
        
        // Currently playing sounds
        this.playingSounds = {
            boost: null
        };
        
        // Initialize audio
        this.init();
    }
    
    init() {
        // Create audio context
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API is not supported in this browser');
            return;
        }
        
        // Load sound effects
        this.loadSounds();
    }
    
    loadSounds() {
        // Load countdown beep sound
        this.loadSound('countdown', 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        
        // Load countdown "Go" sound
        this.loadSound('countdownGo', 'https://assets.mixkit.co/active_storage/sfx/2309/2309-preview.mp3');
        
        // Load boost sound
        this.loadSound('boost', 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3');
    }
    
    loadSound(name, url) {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.sounds[name] = audioBuffer;
                console.log(`Sound loaded: ${name}`);
            })
            .catch(error => console.error(`Error loading sound ${name}:`, error));
    }
    
    playSound(name, options = {}) {
        // Check if audio context and sound are available
        if (!this.audioContext || !this.sounds[name]) {
            return null;
        }
        
        // Create source
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume !== undefined ? options.volume : 1.0;
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set loop if specified
        if (options.loop) {
            source.loop = true;
        }
        
        // Play sound
        source.start(0);
        
        // Store reference to looping sounds
        if (options.loop) {
            this.playingSounds[name] = {
                source: source,
                gainNode: gainNode
            };
        }
        
        // Return source for control
        return {
            source: source,
            gainNode: gainNode
        };
    }
    
    stopSound(name) {
        // Check if sound is playing
        if (this.playingSounds[name]) {
            try {
                this.playingSounds[name].source.stop();
            } catch (e) {
                // Ignore errors if sound has already stopped
            }
            this.playingSounds[name] = null;
        }
    }
    
    // Play countdown beep
    playCountdown() {
        return this.playSound('countdown', { volume: 0.7 });
    }
    
    // Play countdown "Go" sound
    playCountdownGo() {
        return this.playSound('countdownGo', { volume: 0.8 });
    }
    
    // Start boost sound
    startBoost() {
        // Only start the boost sound if it's not already playing
        if (!this.playingSounds.boost) {
            // Play new boost sound
            this.playingSounds.boost = this.playSound('boost', { 
                loop: true, 
                volume: 0.3 // Reduced volume to prevent it from being too loud
            });
        }
    }
    
    // Stop boost sound
    stopBoost() {
        this.stopSound('boost');
    }
    
    // Resume audio context if it was suspended (needed for browsers that require user interaction)
    resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}
