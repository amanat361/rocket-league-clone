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
