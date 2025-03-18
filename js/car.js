/**
 * Car class for creating and managing the player's car
 */
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { directionFromRotation } from './utils.js';

export class Car {
    constructor(scene, world, team = 'blue', isPlayer = false) {
        this.scene = scene;
        this.world = world; // Physics world
        this.team = team; // 'blue' or 'orange'
        this.isPlayer = isPlayer; // Is this the player's car?
        
        this.mesh = null;
        this.body = null;
        this.wheels = [];
        this.boostParticles = [];
        
        // Car dimensions
        this.dimensions = {
            width: 8,
            height: 5,
            length: 12
        };
        
        // Car physics properties - simplified for arcade-style movement
        this.mass = 10;
        this.maxSpeed = 80; // Increased max speed for quicker movement
        this.acceleration = 800; // Increased acceleration for more responsive controls
        this.braking = 1200; // Increased braking force for faster stopping
        this.turnSpeed = 40.0; // Doubled turning speed to ensure it works properly
        this.friction = 0.5; // Increased friction to reduce sliding
        
        // Car state
        this.isBoosting = false;
        this.boostAmount = 100; // 0-100
        this.boostRechargeRate = 10; // Per second
        this.boostConsumptionRate = 0; // Set to 0 for unlimited boost
        this.boostForce = 1200; // Boost force
        this.jumpForce = 500; // Increased jump force
        this.canJump = true;
        this.isJumping = false;
        this.jumpCooldown = 0;
        this.jumpCooldownTime = 0.3; // Reduced cooldown time
        
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
        
        // Movement direction - always in car's local space
        this.movementDirection = new THREE.Vector3();
        
        // Current velocity for manual control
        this.currentSpeed = 0;
        
        // Track if we're turning
        this.isTurning = false;
        
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
        this.scene.add(this.mesh);
        
        // Add details to the car
        this.addCarDetails();
        
        // Create car physics body
        const shape = new CANNON.Box(new CANNON.Vec3(
            this.dimensions.width / 2,
            this.dimensions.height / 2,
            this.dimensions.length / 2
        ));
        
        this.body = new CANNON.Body({
            mass: this.mass,
            position: new CANNON.Vec3(
                this.team === 'blue' ? -50 : 50,
                this.dimensions.height / 2 + 1,
                this.team === 'blue' ? -120 : 120
            ),
            shape: shape,
            material: new CANNON.Material({
                friction: this.friction,
                restitution: 0.2 // Reduced bounciness
            }),
            linearDamping: 0.7, // Increased damping for less sliding
            angularDamping: 0.1 // Significantly reduced angular damping to allow better turning
        });
        
        // Set initial rotation based on team
        if (this.team === 'orange') {
            this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
        }
        
        // Increase gravity for this body to make it fall faster
        this.body.gravity = new CANNON.Vec3(0, -20, 0); // Default is (0, -9.82, 0)
        
        this.world.addBody(this.body);
        
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
        const carRotation = new THREE.Euler().setFromQuaternion(this.mesh.quaternion);
        const direction = directionFromRotation(carRotation);
        direction.multiplyScalar(-1); // Backward direction
        
        // Get position of the boost nozzle
        const nozzlePosition = new THREE.Vector3(0, -1, -this.dimensions.length / 2 - 1);
        nozzlePosition.applyQuaternion(this.mesh.quaternion);
        nozzlePosition.add(this.mesh.position);
        
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
                
                // Randomize particle size for more dynamic effect
                const baseSize = Math.random() * 0.5 + 0.5;
                particle.mesh.scale.set(baseSize, baseSize, baseSize);
                
                // Increase particle speed for more dramatic trail
                particle.speed = Math.random() * 3 + 2;
            } else {
                // Update particle position
                const moveDirection = direction.clone().add(particle.offset);
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
        // Update car mesh position and rotation from physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
        
        // Handle controls
        this.handleControls(deltaTime);
        
        // Update boost particles
        this.updateBoostParticles(deltaTime);
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        } else if (!this.canJump && this.isOnGround()) {
            this.canJump = true;
        }
        
        // Recharge boost
        if (!this.isBoosting && this.boostAmount < 100) {
            this.boostAmount += this.boostRechargeRate * deltaTime;
            if (this.boostAmount > 100) this.boostAmount = 100;
        }
        
        // Check if car is out of bounds (fell through the floor)
        if (this.body.position.y < -50) {
            this.reset();
        }
        
        // Force car to stay upright - prevent unwanted rotations
        if (this.isOnGround()) {
            // Get current rotation
            const rotation = new THREE.Euler().setFromQuaternion(this.mesh.quaternion);
            
            // Create a new quaternion with only the Y rotation (yaw)
            const uprightQuaternion = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, rotation.y, 0)
            );
            
            // Apply the upright quaternion to the physics body
            this.body.quaternion.copy(uprightQuaternion);
            
            // Reset X and Z angular velocity to prevent spinning, but keep Y for turning
            this.body.angularVelocity.x = 0;
            this.body.angularVelocity.z = 0;
            
            // If we're not turning, gradually reduce Y angular velocity
            // But don't reduce it too quickly to allow turning momentum
            if (!this.isTurning) {
                this.body.angularVelocity.y *= 0.95; // Slower decay to maintain turning momentum
            }
        }
    }
    
    handleControls(deltaTime) {
        // Simplified arcade-style car controls
        
        // Get the car's forward direction (only considering Y rotation)
        const rotation = new THREE.Euler().setFromQuaternion(this.mesh.quaternion);
        const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, rotation.y, 0));
        
        // Determine if we're driving forward or backward
        const isDrivingBackward = 
            (this.controls.backward && !this.controls.forward) || 
            (this.currentSpeed < 0);
        
        // Handle acceleration and braking
        if (this.controls.forward) {
            this.currentSpeed += this.acceleration * deltaTime;
        } else if (this.controls.backward) {
            this.currentSpeed -= this.braking * deltaTime;
        } else {
            // Apply automatic braking when no input
            if (this.currentSpeed > 0) {
                this.currentSpeed -= this.braking * deltaTime;
                if (this.currentSpeed < 0) this.currentSpeed = 0;
            } else if (this.currentSpeed < 0) {
                this.currentSpeed += this.braking * deltaTime;
                if (this.currentSpeed > 0) this.currentSpeed = 0;
            }
        }
        
        // Apply boost
        this.isBoosting = false;
        if (this.controls.boost && !isDrivingBackward) {
            this.isBoosting = true;
            this.currentSpeed += this.boostForce * deltaTime;
        }
        
        // Clamp speed to max speed
        const effectiveMaxSpeed = this.isBoosting ? this.maxSpeed * 1.5 : this.maxSpeed;
        this.currentSpeed = Math.max(Math.min(this.currentSpeed, effectiveMaxSpeed), -this.maxSpeed * 0.6);
        
        // Apply turning - invert controls when driving backward
        let turnAmount = 0;
        if (this.controls.left) {
            turnAmount = isDrivingBackward ? -this.turnSpeed : this.turnSpeed;
            this.isTurning = true;
        } else if (this.controls.right) {
            turnAmount = isDrivingBackward ? this.turnSpeed : -this.turnSpeed;
            this.isTurning = true;
        } else {
            this.isTurning = false;
        }
        
        // Apply turning directly to angular velocity for immediate response
        if (turnAmount !== 0) {
            // Set angular velocity directly for immediate response
            this.body.angularVelocity.y = turnAmount;
            
            // Force the turning to take effect by applying a small impulse
            // This helps overcome any physics constraints that might be preventing turning
            const impulse = new CANNON.Vec3(0, 0, 0);
            const point = new CANNON.Vec3(0, 0, 0);
            this.body.applyImpulse(impulse, point);
            
            // Debug log to verify turning is being applied
            console.log(`Turning: ${turnAmount > 0 ? 'left' : 'right'}, Angular velocity Y: ${this.body.angularVelocity.y}`);
        }
        
        // Apply movement in the car's forward direction
        if (Math.abs(this.currentSpeed) > 0.1) {
            // Calculate velocity based on current speed and direction
            const velocity = forwardDir.clone().multiplyScalar(this.currentSpeed);
            
            // Keep the Y velocity (for jumps) but replace X and Z
            this.body.velocity.x = velocity.x;
            this.body.velocity.z = velocity.z;
        }
        
        // Handle jump
        if (this.controls.jump && this.canJump && !this.isJumping && this.isOnGround()) {
            // Apply jump force
            this.body.velocity.y = this.jumpForce * 0.1;
            
            this.isJumping = true;
            this.canJump = false;
            this.jumpCooldown = this.jumpCooldownTime;
        } else if (!this.controls.jump) {
            this.isJumping = false;
        }
    }
    
    isOnGround() {
        // Raycast to check if car is on ground
        const start = this.body.position;
        const end = new CANNON.Vec3(
            start.x,
            start.y - (this.dimensions.height / 2 + 0.5),
            start.z
        );
        
        const result = new CANNON.RaycastResult();
        this.world.raycastClosest(start, end, { collisionFilterMask: 1 }, result);
        
        return result.hasHit;
    }
    
    reset(position = null) {
        // Reset car position
        if (position) {
            this.body.position.copy(position);
        } else {
            this.body.position.set(
                this.team === 'blue' ? -50 : 50,
                this.dimensions.height / 2 + 1,
                this.team === 'blue' ? -120 : 120
            );
        }
        
        // Reset car rotation based on team
        if (this.team === 'blue') {
            this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
        } else {
            this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
        }
        
        // Reset car velocity and angular velocity
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        
        // Reset car state
        this.currentSpeed = 0;
        this.boostAmount = 100;
        this.canJump = true;
        this.isJumping = false;
        this.jumpCooldown = 0;
        this.isTurning = false;
        
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
    }
    
    get position() {
        return this.mesh.position;
    }
    
    get velocity() {
        return new THREE.Vector3(
            this.body.velocity.x,
            this.body.velocity.y,
            this.body.velocity.z
        );
    }
}
