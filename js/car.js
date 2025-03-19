/**
 * Car class for creating and managing the player's car
 * Ultra-simplified implementation with reliable controls
 */
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { clamp } from './utils.js';

export class Car {
    constructor(scene, world, team = 'blue', isPlayer = false) {
        this.scene = scene;
        this.world = world;
        this.team = team; // 'blue' or 'orange'
        this.isPlayer = isPlayer;
        
        // Car meshes
        this.mesh = null;
        this.wheels = [];
        this.boostParticles = [];
        
        // Car dimensions
        this.dimensions = {
            width: 8,
            height: 5,
            length: 12
        };
        
        // Simple driving properties
        this.position = new THREE.Vector3(
            this.team === 'blue' ? -50 : 50,
            this.dimensions.height / 2 + 1,
            this.team === 'blue' ? -120 : 120
        );
        this.rotation = new THREE.Euler(0, this.team === 'blue' ? 0 : Math.PI, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = 0; // Only for Y-axis rotation
        
        // Car physics properties - ultra simplified
        this.maxSpeed = 80;
        this.acceleration = 120;
        this.deceleration = 200;
        this.turnSpeed = 2.5;
        this.driftTurnMultiplier = 1.8;
        this.gravity = 20;
        this.jumpForce = 10;
        this.groundLevel = this.dimensions.height / 2 + 0.5;
        
        // Car state
        this.speed = 0;
        this.isBoosting = false;
        this.boostAmount = 100; // 0-100
        this.boostRechargeRate = 10; // Per second
        this.boostForce = 200;
        this.canJump = true;
        this.isJumping = false;
        this.jumpCooldown = 0;
        this.jumpCooldownTime = 0.3;
        this.isDrifting = false;
        this.isOnGround = true;
        
        // Controls state
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            boost: false,
            jump: false,
            drift: false
        };
        
        this.createCar();
    }
    
    createCar() {
        // Create car body geometry
        const bodyGeometry = new THREE.BoxGeometry(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.length
        );
        
        // Create car material based on team
        const bodyColor = this.team === 'blue' ? 0x0066ff : 0xff6600;
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Create car mesh
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        this.scene.add(this.mesh);
        
        // Add details to the car
        this.addCarDetails();
        
        // Create boost particles
        this.createBoostParticles();
    }
    
    addCarDetails() {
        // Add roof
        const roofGeometry = new THREE.BoxGeometry(
            this.dimensions.width * 0.8,
            this.dimensions.height * 0.4,
            this.dimensions.length * 0.6
        );
        
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.5,
            metalness: 0.5
        });
        
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, this.dimensions.height * 0.7, -this.dimensions.length * 0.1);
        roof.castShadow = true;
        this.mesh.add(roof);
        
        // Add wheels
        const wheelGeometry = new THREE.CylinderGeometry(2, 2, 1, 16);
        wheelGeometry.rotateZ(Math.PI / 2);
        
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.7,
            metalness: 0.5
        });
        
        // Wheel positions
        const wheelPositions = [
            { x: -this.dimensions.width / 2 - 0.5, y: -this.dimensions.height / 2 + 1, z: this.dimensions.length / 3 },
            { x: this.dimensions.width / 2 + 0.5, y: -this.dimensions.height / 2 + 1, z: this.dimensions.length / 3 },
            { x: -this.dimensions.width / 2 - 0.5, y: -this.dimensions.height / 2 + 1, z: -this.dimensions.length / 3 },
            { x: this.dimensions.width / 2 + 0.5, y: -this.dimensions.height / 2 + 1, z: -this.dimensions.length / 3 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.castShadow = true;
            this.mesh.add(wheel);
            this.wheels.push(wheel);
        });
        
        // Add windshield
        const windshieldGeometry = new THREE.BoxGeometry(
            this.dimensions.width * 0.7,
            this.dimensions.height * 0.3,
            this.dimensions.length * 0.1
        );
        
        const windshieldMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.set(0, this.dimensions.height * 0.5, this.dimensions.length * 0.2);
        this.mesh.add(windshield);
        
        // Add boost nozzle
        const nozzleGeometry = new THREE.CylinderGeometry(1, 1.5, 2, 16);
        
        const nozzleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.8
        });
        
        const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzle.position.set(0, -1, -this.dimensions.length / 2 - 1);
        nozzle.rotation.x = Math.PI / 2;
        this.mesh.add(nozzle);
    }
    
    createBoostParticles() {
        const particleCount = 100;
        const particleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        
        // Create particle material based on team
        const particleColor = this.team === 'blue' ? 0x0088ff : 0xff8800;
        
        const particleMaterial = new THREE.MeshStandardMaterial({
            color: particleColor,
            transparent: true,
            opacity: 0.8,
            emissive: particleColor,
            emissiveIntensity: 2.0,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            particle.visible = false;
            this.scene.add(particle);
            
            this.boostParticles.push({
                mesh: particle,
                life: 0,
                speed: Math.random() * 2 + 1,
                offset: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                )
            });
        }
    }
    
    updateBoostParticles(deltaTime) {
        if (!this.isBoosting) {
            // Hide all particles when not boosting
            this.boostParticles.forEach(particle => {
                particle.mesh.visible = false;
                particle.life = 0;
            });
            return;
        }
        
        // Get car's backward direction
        const carDirection = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation);
        const backwardDirection = carDirection.clone().multiplyScalar(-1);
        
        // Get position of the boost nozzle
        const nozzlePosition = new THREE.Vector3(0, -1, -this.dimensions.length / 2 - 1);
        nozzlePosition.applyEuler(this.rotation);
        nozzlePosition.add(this.position);
        
        // Update particles
        this.boostParticles.forEach(particle => {
            if (particle.life <= 0) {
                // Reset particle
                particle.mesh.position.copy(nozzlePosition);
                particle.mesh.visible = true;
                particle.life = 1.0;
                
                // Randomize particle color for cool effect
                const hue = Math.random();
                const particleColor = this.team === 'blue' 
                    ? new THREE.Color().setHSL(0.6 + hue * 0.1, 1, 0.5) // Blue variations
                    : new THREE.Color().setHSL(0.05 + hue * 0.1, 1, 0.5); // Orange variations
                
                particle.mesh.material.color.set(particleColor);
                
                // Randomize particle size
                const baseSize = Math.random() * 0.5 + 0.5;
                particle.mesh.scale.set(baseSize, baseSize, baseSize);
                
                particle.speed = Math.random() * 3 + 2;
            } else {
                // Update particle position
                const moveDirection = backwardDirection.clone().add(particle.offset);
                particle.mesh.position.addScaledVector(moveDirection, particle.speed * deltaTime * 15);
                
                // Update particle life
                particle.life -= deltaTime * 1.5;
                
                // Update particle appearance
                particle.mesh.material.opacity = particle.life * 0.8;
                const scale = particle.life * 0.7 + 0.3;
                particle.mesh.scale.set(scale, scale, scale);
                
                // Hide particle when life is over
                if (particle.life <= 0) {
                    particle.mesh.visible = false;
                }
            }
        });
    }
    
    setControls(controls) {
        this.controls = { ...this.controls, ...controls };
    }
    
    update(deltaTime) {
        // Handle controls
        this.handleControls(deltaTime);
        
        // Apply gravity if not on ground
        if (!this.isOnGround) {
            this.velocity.y -= this.gravity * deltaTime;
        }
        
        // Update position based on velocity
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update rotation based on angular velocity
        this.rotation.y += this.angularVelocity * deltaTime;
        
        // Check ground collision
        if (this.position.y <= this.groundLevel) {
            this.position.y = this.groundLevel;
            this.velocity.y = 0;
            this.isOnGround = true;
        }
        
        // Check for ball collision - this will be called by the game class
        // but we need to have the method available
        
        // Update mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Update boost particles
        this.updateBoostParticles(deltaTime);
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        } else if (!this.canJump && this.isOnGround) {
            this.canJump = true;
        }
        
        // Recharge boost
        if (!this.isBoosting && this.boostAmount < 100) {
            this.boostAmount += this.boostRechargeRate * deltaTime;
            if (this.boostAmount > 100) this.boostAmount = 100;
        }
        
        // Check if car is out of bounds (fell through the floor)
        if (this.position.y < -50) {
            this.reset();
        }
        
        // Simple stadium boundary checks
        const stadiumWidth = 300;
        const stadiumLength = 450;
        const halfWidth = stadiumWidth / 2;
        const halfLength = stadiumLength / 2;
        
        // Bounce off walls
        if (Math.abs(this.position.x) > halfWidth - this.dimensions.width / 2) {
            this.position.x = Math.sign(this.position.x) * (halfWidth - this.dimensions.width / 2);
            this.velocity.x *= -0.5; // Bounce with some energy loss
        }
        
        if (Math.abs(this.position.z) > halfLength - this.dimensions.length / 2) {
            this.position.z = Math.sign(this.position.z) * (halfLength - this.dimensions.length / 2);
            this.velocity.z *= -0.5; // Bounce with some energy loss
        }
    }
    
    handleControls(deltaTime) {
        // Get the car's forward direction
        const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation);
        
        // Determine if we're driving forward or backward
        const isDrivingBackward = 
            (this.controls.backward && !this.controls.forward) || 
            (this.speed < 0);
        
        // Handle acceleration and braking
        if (this.controls.forward) {
            this.speed += this.acceleration * deltaTime;
        } else if (this.controls.backward) {
            this.speed -= this.acceleration * deltaTime;
        } else {
            // Apply automatic deceleration when no input
            if (this.speed > 0) {
                this.speed -= this.deceleration * deltaTime;
                if (this.speed < 0) this.speed = 0;
            } else if (this.speed < 0) {
                this.speed += this.deceleration * deltaTime;
                if (this.speed > 0) this.speed = 0;
            }
        }
        
        // Apply boost
        this.isBoosting = false;
        if (this.controls.boost && !isDrivingBackward && this.isOnGround) {
            this.isBoosting = true;
            this.speed += this.boostForce * deltaTime;
        }
        
        // Clamp speed to max speed
        const effectiveMaxSpeed = this.isBoosting ? this.maxSpeed * 1.5 : this.maxSpeed;
        this.speed = clamp(this.speed, -this.maxSpeed * 0.6, effectiveMaxSpeed);
        
        // Check if drifting
        this.isDrifting = this.controls.drift && Math.abs(this.speed) > 20 && this.isOnGround;
        
        // Handle turning
        if (this.isOnGround) {
            let turnAmount = 0;
            
            // Calculate turn amount based on controls
            if (this.controls.left) {
                turnAmount = isDrivingBackward ? -1 : 1;
            } else if (this.controls.right) {
                turnAmount = isDrivingBackward ? 1 : -1;
            }
            
            if (turnAmount !== 0) {
                // Improved turning at speed - less reduction at higher speeds
                // and a higher minimum to ensure responsive turning
                const speedFactor = Math.max(
                    0.8, // Increased minimum turn effectiveness at high speed (80%)
                    1 - (Math.abs(this.speed) / this.maxSpeed) * 0.2 // Reduce by only 20% at max speed
                );
                
                // Increased base turn speed
                let effectiveTurnRate = this.turnSpeed * 1.5 * speedFactor;
                
                // Apply drift boost if drifting
                if (this.isDrifting) {
                    effectiveTurnRate *= this.driftTurnMultiplier;
                }
                
                // Apply turn as angular velocity
                this.angularVelocity = turnAmount * effectiveTurnRate;
            } else {
                // Gradually reduce turning when no input
                this.angularVelocity *= 0.9;
            }
        }
        
        // Apply movement in the car's forward direction
        if (Math.abs(this.speed) > 0.1) {
            // Calculate velocity based on current speed and direction
            const moveVelocity = forwardDir.clone().multiplyScalar(this.speed);
            
            // Keep the Y velocity (for jumps) but replace X and Z
            this.velocity.x = moveVelocity.x;
            this.velocity.z = moveVelocity.z;
        } else {
            // Apply friction to slow down X and Z velocity when speed is very low
            this.velocity.x *= 0.95;
            this.velocity.z *= 0.95;
        }
        
        // Handle jump
        if (this.controls.jump && this.canJump && !this.isJumping && this.isOnGround) {
            // Apply jump force
            this.velocity.y = this.jumpForce;
            this.isOnGround = false;
            this.isJumping = true;
            this.canJump = false;
            this.jumpCooldown = this.jumpCooldownTime;
        } else if (!this.controls.jump) {
            this.isJumping = false;
        }
    }
    
    reset(position = null) {
        // Reset car position
        if (position) {
            this.position.copy(position);
        } else {
            this.position.set(
                this.team === 'blue' ? -50 : 50,
                this.groundLevel,
                this.team === 'blue' ? -120 : 120
            );
        }
        
        // Reset car rotation based on team
        this.rotation.set(0, this.team === 'blue' ? 0 : Math.PI, 0);
        
        // Reset car velocity and angular velocity
        this.velocity.set(0, 0, 0);
        this.angularVelocity = 0;
        
        // Reset car state
        this.speed = 0;
        this.boostAmount = 100;
        this.canJump = true;
        this.isJumping = false;
        this.jumpCooldown = 0;
        this.isDrifting = false;
        this.isOnGround = true;
        
        // Reset controls
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            boost: false,
            jump: false,
            drift: false
        };
        
        // Update mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
    }
    
    // Handle collision with the ball
    handleBallCollision(ball) {
        // Get ball properties from the ball's CANNON physics body
        const ballPosition = ball.position;
        const ballRadius = ball.radius || 5; // Default to 5 if not specified
        
        // Calculate car's bounding sphere for simple collision
        const carRadius = Math.max(
            this.dimensions.width / 2,
            this.dimensions.height / 2,
            this.dimensions.length / 2
        );
        
        // Calculate distance between car and ball centers
        const distance = this.position.distanceTo(ballPosition);
        
        // Check if collision occurred
        if (distance < (carRadius + ballRadius)) {
            // Calculate collision normal (direction from car to ball)
            const normal = new THREE.Vector3()
                .subVectors(ballPosition, this.position)
                .normalize();
            
            // Calculate impact force based on car's speed and mass, but scaled down significantly
            const impactForce = Math.abs(this.speed) * 0.3; // Reduced multiplier from mass to 0.3
            
            // Add extra force based on how direct the hit is
            // Get car's forward direction
            const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation);
            
            // Calculate how direct the hit is (1 = direct hit, 0 = glancing hit)
            const directness = Math.abs(forwardDir.dot(normal));
            
            // Calculate final force with directness bonus (reduced multiplier)
            const finalForce = impactForce * (1 + directness * 0.5); // Reduced directness bonus
            
            // Apply impulse to the ball using its CANNON physics method
            ball.applyImpulse(normal, finalForce);
            
            // Add a small upward force for more interesting bounces, but much less than before
            if (this.speed > 40 && directness > 0.8) {
                const upForce = Math.min(this.speed * 0.1, 5); // Significantly reduced upward force
                const upVector = new THREE.Vector3(0, 1, 0);
                ball.applyImpulse(upVector, upForce);
            }
            
            // Apply a small bounce effect to the car
            const bounceStrength = finalForce * 0.05; // Car is heavier so less effect
            const carBounceBack = normal.clone().multiplyScalar(-bounceStrength);
            this.velocity.add(carBounceBack);
            
            // Return true to indicate collision occurred
            return true;
        }
        
        // No collision
        return false;
    }
    
    // Compatibility methods for the rest of the game
    get body() {
        return {
            position: this.position,
            velocity: this.velocity,
            quaternion: new THREE.Quaternion().setFromEuler(this.rotation),
            angularVelocity: new CANNON.Vec3(0, this.angularVelocity, 0)
        };
    }
    
    // Add mass property for collision calculations
    get mass() {
        return 10; // Car mass
    }
}
