/**
 * Game class for managing the game state and mechanics
 */
class Game {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        // Game objects
        this.stadium = null;
        this.ball = null;
        this.playerCar = null;
        this.opponentCar = null;
        
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
        
        // UI elements
        this.blueScoreElement = document.getElementById('blue-score');
        this.orangeScoreElement = document.getElementById('orange-score');
        this.timerElement = document.getElementById('timer');
        
        // Camera settings
        this.cameraMode = 'follow'; // 'follow', 'orbit', 'top'
        this.camera = null;
        this.orbitControls = null;
        
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
        
        // Create orbit controls for debug/spectator mode
        this.orbitControls = new THREE.OrbitControls(this.camera, document.getElementById('game'));
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
        // Follow player car
        const car = this.playerCar;
        
        // Get car's forward direction
        const carRotation = new THREE.Euler().setFromQuaternion(car.mesh.quaternion);
        const carDirection = directionFromRotation(carRotation);
        
        // Calculate camera position - position behind the car
        // Use negative Z to position camera behind the car
        const cameraOffset = new THREE.Vector3(0, 12, -25);
        cameraOffset.applyQuaternion(car.mesh.quaternion);
        
        // Smoothly move camera to new position - increased lerp factor for tighter following
        const targetPosition = car.position.clone().add(cameraOffset);
        this.camera.position.lerp(targetPosition, deltaTime * 10);
        
        // Look at the car position plus a small forward offset
        const lookAtOffset = carDirection.clone().multiplyScalar(10);
        const targetLookAt = car.position.clone().add(lookAtOffset);
        
        // Directly look at the target point without lerping for more responsive camera
        this.camera.lookAt(targetLookAt);
    }
    
    updateTopCamera() {
        // Top-down view of the field
        this.camera.position.set(0, 150, 0);
        this.camera.lookAt(0, 0, 0);
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
        
        // Get car's forward direction
        const carRotation = new THREE.Euler().setFromQuaternion(car.mesh.quaternion);
        const carForward = directionFromRotation(carRotation);
        
        // Calculate dot product to determine if ball is in front of car
        const dotProduct = carForward.dot(directionToBall);
        
        // Calculate angle between car forward and direction to ball
        const angle = Math.acos(clamp(dotProduct, -1, 1));
        
        // Determine if ball is to the left or right of car
        const cross = carForward.clone().cross(directionToBall);
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
            
            // Use boost if far from ball
            if (distanceToBall > 50 && car.boostAmount > 20) {
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
        
        // Start countdown timer
        const countdownInterval = setInterval(() => {
            this.countdownTime--;
            
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
        } else {
            this.timerElement.textContent = formatTime(this.timeRemaining);
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
