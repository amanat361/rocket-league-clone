/**
 * Game class for managing the game state and mechanics
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon';
import { Stadium } from './stadium.js';
import { Ball } from './ball.js';
import { Car } from './car.js';
import { AudioManager } from './audio.js';
import { formatTime, directionFromRotation, clamp } from './utils.js';

export class Game {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        // Game objects
        this.stadium = null;
        this.ball = null;
        this.playerCar = null;
        this.opponentCar = null;
        
        // Audio manager
        this.audio = new AudioManager();
        
        // Game state
        this.score = {
            blue: 0,
            orange: 0
        };
        this.gameTime = 5 * 60; // 5 minutes in seconds
        this.timeRemaining = this.gameTime;
        this.isGameOver = false;
        this.isPaused = false;
        this.countdownTime = 3; // Countdown time in seconds
        this.isCountingDown = false;
        
        // Track AI boost state
        this.aiWasBoosting = false;
        
        // UI elements
        this.blueScoreElement = document.getElementById('blue-score');
        this.orangeScoreElement = document.getElementById('orange-score');
        this.timerElement = document.getElementById('timer');
        
        // Create a large countdown display element
        this.countdownDisplay = document.createElement('div');
        this.countdownDisplay.id = 'countdown-display';
        this.countdownDisplay.style.position = 'absolute';
        this.countdownDisplay.style.top = '50%';
        this.countdownDisplay.style.left = '50%';
        this.countdownDisplay.style.transform = 'translate(-50%, -50%)';
        this.countdownDisplay.style.fontSize = '120px';
        this.countdownDisplay.style.fontWeight = 'bold';
        this.countdownDisplay.style.color = 'white';
        this.countdownDisplay.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
        this.countdownDisplay.style.zIndex = '100';
        this.countdownDisplay.style.display = 'none';
        document.getElementById('game-container').appendChild(this.countdownDisplay);
        
        // Camera settings
        this.cameraMode = 'follow'; // 'follow', 'orbit', 'top'
        this.camera = null;
        this.orbitControls = null;
        
        // Camera smoothing
        this.cameraTargetPosition = new THREE.Vector3();
        this.cameraTargetLookAt = new THREE.Vector3();
        this.cameraSmoothing = 0.08; // Lower value = smoother camera (0-1)
        
        // Camera stability
        this.cameraUpVector = new THREE.Vector3(0, 1, 0); // Keep camera upright
        this.cameraMaxTilt = Math.PI / 6; // Limit camera tilt to 30 degrees
        this.cameraStabilizationFactor = 0.95; // Higher value = more stable
        
        // Lighting
        this.lights = [];
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Create stadium
        this.stadium = new Stadium(this.scene, this.world);
        
        // Create ball
        this.ball = new Ball(this.scene, this.world);
        
        // Create player car (blue team)
        this.playerCar = new Car(this.scene, this.world, 'blue', true);
        
        // Create opponent car (orange team)
        this.opponentCar = new Car(this.scene, this.world, 'orange', false);
        
        // Set up camera
        this.setupCamera();
        
        // Set up lighting
        this.setupLighting();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start countdown
        this.startCountdown();
    }
    
    setupCamera() {
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        
        // Set initial camera position
        this.camera.position.set(0, 40, 100);
        this.camera.lookAt(0, 0, 0);
        
        // Initialize camera target positions
        this.cameraTargetPosition.copy(this.camera.position);
        this.cameraTargetLookAt.set(0, 0, 0);
        
        // Create orbit controls for debug/spectator mode
        this.orbitControls = new OrbitControls(this.camera, document.getElementById('game'));
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.screenSpacePanning = false;
        this.orbitControls.minDistance = 20;
        this.orbitControls.maxDistance = 500;
        this.orbitControls.maxPolarAngle = Math.PI / 2;
        this.orbitControls.enabled = false; // Disabled by default
    }
    
    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 50);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -150;
        directionalLight.shadow.camera.right = 150;
        directionalLight.shadow.camera.top = 150;
        directionalLight.shadow.camera.bottom = -150;
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // Add stadium lights
        const stadiumLightPositions = [
            { x: -50, y: 30, z: -80 },
            { x: 50, y: 30, z: -80 },
            { x: -50, y: 30, z: 80 },
            { x: 50, y: 30, z: 80 }
        ];
        
        stadiumLightPositions.forEach(pos => {
            const spotLight = new THREE.SpotLight(0xffffff, 0.6);
            spotLight.position.set(pos.x, pos.y, pos.z);
            spotLight.target.position.set(0, 0, 0);
            spotLight.angle = Math.PI / 6;
            spotLight.penumbra = 0.3;
            spotLight.decay = 1;
            spotLight.distance = 300;
            spotLight.castShadow = true;
            
            // Configure shadow properties
            spotLight.shadow.mapSize.width = 1024;
            spotLight.shadow.mapSize.height = 1024;
            spotLight.shadow.camera.near = 10;
            spotLight.shadow.camera.far = 300;
            
            this.scene.add(spotLight);
            this.scene.add(spotLight.target);
            this.lights.push(spotLight);
        });
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleKeyDown(event) {
        if (this.isPaused || this.isGameOver || this.isCountingDown) return;
        
        // Player car controls
        switch (event.key.toLowerCase()) {
            case 'w':
                this.playerCar.setControls({ forward: true });
                break;
            case 's':
                this.playerCar.setControls({ backward: true });
                break;
            case 'a':
                this.playerCar.setControls({ left: true });
                break;
            case 'd':
                this.playerCar.setControls({ right: true });
                break;
            case ' ':
                this.playerCar.setControls({ jump: true });
                break;
            case 'shift':
                this.playerCar.setControls({ boost: true });
                // Start boost sound
                this.audio.startBoost();
                break;
            case 'control':
                this.playerCar.setControls({ drift: true });
                break;
            
            // Camera controls
            case 'c':
                this.cycleCameraMode();
                break;
            
            // Game controls
            case 'p':
                this.togglePause();
                break;
            case 'r':
                this.resetRound();
                break;
        }
    }
    
    handleKeyUp(event) {
        // Player car controls
        switch (event.key.toLowerCase()) {
            case 'w':
                this.playerCar.setControls({ forward: false });
                break;
            case 's':
                this.playerCar.setControls({ backward: false });
                break;
            case 'a':
                this.playerCar.setControls({ left: false });
                break;
            case 'd':
                this.playerCar.setControls({ right: false });
                break;
            case ' ':
                this.playerCar.setControls({ jump: false });
                break;
            case 'shift':
                this.playerCar.setControls({ boost: false });
                // Stop boost sound
                this.audio.stopBoost();
                break;
            case 'control':
                this.playerCar.setControls({ drift: false });
                break;
        }
    }
    
    handleResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
    
    cycleCameraMode() {
        // Cycle through camera modes
        switch (this.cameraMode) {
            case 'follow':
                this.cameraMode = 'orbit';
                this.orbitControls.enabled = true;
                break;
            case 'orbit':
                this.cameraMode = 'top';
                this.orbitControls.enabled = false;
                break;
            case 'top':
                this.cameraMode = 'follow';
                this.orbitControls.enabled = false;
                break;
        }
    }
    
    updateCamera(deltaTime) {
        // Update camera based on current mode
        switch (this.cameraMode) {
            case 'follow':
                this.updateFollowCamera(deltaTime);
                break;
            case 'orbit':
                this.orbitControls.update();
                break;
            case 'top':
                this.updateTopCamera();
                break;
        }
    }
    
    updateFollowCamera(deltaTime) {
        // Follow player car with a completely decoupled camera system
        const car = this.playerCar;
        
        // Create a stable camera reference frame that only considers Y-axis rotation (yaw)
        // This ensures the camera follows the car's direction but doesn't flip or roll with it
        
        // Get car's current quaternion
        const carQuaternion = car.mesh.quaternion.clone();
        
        // Extract just the Y-rotation component to create a stable camera reference
        // Using 'YXZ' order ensures we extract yaw correctly regardless of car orientation
        const carEuler = new THREE.Euler().setFromQuaternion(carQuaternion, 'YXZ');
        
        // Create a quaternion with only the Y-rotation (yaw)
        // This completely ignores any roll or pitch of the car
        const stableQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, carEuler.y, 0)
        );
        
        // Get stable forward direction using only the Y-rotation
        const stableForward = new THREE.Vector3(0, 0, 1).applyQuaternion(stableQuaternion);
        
        // Calculate ideal camera position - position behind the car
        // Apply the stable quaternion to ensure camera only follows car's heading, not its roll
        const cameraOffset = new THREE.Vector3(0, 20, -40); // Height and distance for good view
        cameraOffset.applyQuaternion(stableQuaternion);
        
        // Calculate target position
        const idealPosition = car.position.clone().add(cameraOffset);
        
        // Ensure camera doesn't go below ground level
        idealPosition.y = Math.max(idealPosition.y, 5);
        
        // Smoothly update camera target position with reduced smoothing for more responsive camera
        this.cameraTargetPosition.lerp(idealPosition, this.cameraSmoothing);
        
        // Calculate look-at point - slightly ahead of the car
        // Use the stable forward direction to ensure consistent look-at point
        const lookAtOffset = stableForward.clone().multiplyScalar(30);
        const idealLookAt = car.position.clone().add(lookAtOffset).add(new THREE.Vector3(0, 5, 0));
        
        // Smoothly update camera target look-at
        this.cameraTargetLookAt.lerp(idealLookAt, this.cameraSmoothing);
        
        // Apply smoothed camera position and look-at
        this.camera.position.copy(this.cameraTargetPosition);
        this.camera.lookAt(this.cameraTargetLookAt);
        
        // Always keep camera upright regardless of car orientation
        this.camera.up.set(0, 1, 0);
    }
    
    updateTopCamera() {
        // Top-down view of the field
        this.camera.position.set(0, 150, 0);
        this.camera.lookAt(0, 0, 0);
        
        // Ensure camera is oriented correctly
        this.camera.up.set(0, 0, -1);
    }
    
    updateAI(deltaTime) {
        // Simple AI for opponent car
        const car = this.opponentCar;
        const ball = this.ball;
        
        // Vector from car to ball
        const carToBall = ball.position.clone().sub(car.position);
        
        // Distance to ball
        const distanceToBall = carToBall.length();
        
        // Direction to ball
        const directionToBall = carToBall.normalize();
        
        // Create a stable control reference frame for AI that only considers Y-axis rotation (yaw)
        // This ensures consistent AI controls even when the car is flipping or barrel rolling
        const carQuaternion = car.mesh.quaternion.clone();
        const carEuler = new THREE.Euler().setFromQuaternion(carQuaternion, 'YXZ');
        const stableQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, carEuler.y, 0)
        );
        
        // Get stable forward direction using only the Y-rotation
        const stableForward = new THREE.Vector3(0, 0, 1).applyQuaternion(stableQuaternion);
        
        // Calculate dot product to determine if ball is in front of car using stable forward
        const dotProduct = stableForward.dot(directionToBall);
        
        // Calculate angle between stable forward and direction to ball
        const angle = Math.acos(clamp(dotProduct, -1, 1));
        
        // Determine if ball is to the left or right of car using stable reference frame
        const cross = stableForward.clone().cross(directionToBall);
        const isBallToLeft = cross.y > 0;
        
        // Reset controls
        const controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            boost: false,
            jump: false,
            drift: false
        };
        
        // Drive towards ball
        if (dotProduct > 0.5) {
            // Ball is roughly in front of car
            controls.forward = true;
            
            // Use boost more aggressively since it's now unlimited
            if (distanceToBall > 30) {
                controls.boost = true;
            }
            
            // Jump if close to ball
            if (distanceToBall < 15 && ball.position.y > 5) {
                controls.jump = true;
            }
        } else if (dotProduct < -0.5) {
            // Ball is behind car
            controls.backward = true;
        }
        
        // Turn towards ball
        if (angle > 0.2) {
            if (isBallToLeft) {
                controls.left = true;
            } else {
                controls.right = true;
            }
            
            // Use drift for sharper turns
            if (angle > 1.0) {
                controls.drift = true;
            }
        }
        
        // Play or stop boost sound for AI car based on boost state change
        if (controls.boost && !this.aiWasBoosting) {
            this.audio.startBoost();
        } else if (!controls.boost && this.aiWasBoosting) {
            this.audio.stopBoost();
        }
        
        // Update AI boost state tracking
        this.aiWasBoosting = controls.boost;
        
        // Apply controls to AI car
        car.setControls(controls);
    }
    
    startCountdown() {
        this.isCountingDown = true;
        this.countdownTime = 3;
        
        // Reset positions
        this.resetPositions();
        
        // Update UI
        this.updateUI();
        
        // Resume audio context (needed for browsers that require user interaction)
        this.audio.resumeAudio();
        
        // Play initial countdown sound
        this.audio.playCountdown();
        
        // Start countdown timer
        const countdownInterval = setInterval(() => {
            this.countdownTime--;
            
            // Update UI each time the countdown changes
            this.updateUI();
            
            if (this.countdownTime > 0) {
                // Play countdown sound for numbers
                this.audio.playCountdown();
            } else if (this.countdownTime === 0) {
                // Play "Go" sound when countdown reaches 0
                this.audio.playCountdownGo();
            }
            
            if (this.countdownTime <= 0) {
                clearInterval(countdownInterval);
                this.isCountingDown = false;
            }
        }, 1000);
    }
    
    resetRound() {
        // Reset ball and car positions
        this.resetPositions();
        
        // Start countdown
        this.startCountdown();
    }
    
    resetPositions() {
        // Reset ball
        this.ball.reset();
        
        // Reset cars
        this.playerCar.reset();
        this.opponentCar.reset();
        
        // Reset AI boost state
        this.aiWasBoosting = false;
        
        // Reset camera targets to avoid jarring transitions
        if (this.cameraMode === 'follow') {
            const carPosition = this.playerCar.position.clone();
            
            // Create a stable quaternion for camera reset (only Y rotation)
            const carQuaternion = this.playerCar.mesh.quaternion.clone();
            const carEuler = new THREE.Euler().setFromQuaternion(carQuaternion, 'YXZ');
            const stableQuaternion = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, carEuler.y, 0)
            );
            
            // Apply stable quaternion to camera offset
            const behindCar = new THREE.Vector3(0, 20, -40);
            behindCar.applyQuaternion(stableQuaternion);
            
            // Set camera position behind car
            this.cameraTargetPosition.copy(carPosition).add(behindCar);
            
            // Set look-at point to car position
            this.cameraTargetLookAt.copy(carPosition);
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    checkGoal() {
        // Check if ball is in a goal
        const scoringTeam = this.stadium.checkGoal(this.ball.position);
        
        if (scoringTeam) {
            // Increment score
            this.score[scoringTeam]++;
            
            // Update UI
            this.updateUI();
            
            // Reset round
            this.resetRound();
            
            return true;
        }
        
        return false;
    }
    
    updateTimer(deltaTime) {
        if (this.isPaused || this.isGameOver || this.isCountingDown) return;
        
        // Update time remaining
        this.timeRemaining -= deltaTime;
        
        // Check if game is over
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.isGameOver = true;
        }
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        // Update score
        this.blueScoreElement.textContent = this.score.blue;
        this.orangeScoreElement.textContent = this.score.orange;
        
        // Update timer
        if (this.isCountingDown) {
            this.timerElement.textContent = this.countdownTime;
            
            // Update the large countdown display
            this.countdownDisplay.textContent = this.countdownTime;
            this.countdownDisplay.style.display = 'block';
        } else {
            this.timerElement.textContent = formatTime(this.timeRemaining);
            this.countdownDisplay.style.display = 'none';
        }
    }
    
    update(deltaTime) {
        // Skip updates if paused
        if (this.isPaused) return;
        
        // Skip physics updates during countdown
        if (!this.isCountingDown && !this.isGameOver) {
            // Update game objects
            this.ball.update();
            this.playerCar.update(deltaTime);
            this.opponentCar.update(deltaTime);
            this.stadium.update();
            
            // Update AI
            this.updateAI(deltaTime);
            
            // Check for goals
            this.checkGoal();
            
            // Update timer
            this.updateTimer(deltaTime);
        }
        
        // Always update camera
        this.updateCamera(deltaTime);
    }
}
