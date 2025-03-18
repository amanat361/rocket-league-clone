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
        
        // Car physics properties
        this.mass = 10;
        this.maxSpeed = 60; // Reduced max speed
        this.acceleration = 600; // Reduced acceleration
        this.braking = 1000; // Increased braking force for faster stopping
        this.handling = 0.15; // Reduced handling for less sensitive turning
        this.friction = 0.3; // Increased friction to make floor less slippery
        
        // Car state
        this.isBoosting = false;
        this.boostAmount = 100; // 0-100
        this.boostRechargeRate = 10; // Per second
        this.boostConsumptionRate = 0; // Set to 0 for unlimited boost
        this.boostForce = 3000; // Doubled boost force for significant speed increase
        this.jumpForce = 400;
        this.canJump = true;
        this.isJumping = false;
        this.jumpCooldown = 0;
        this.jumpCooldownTime = 0.5; // Seconds
        
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
                restitution: 0.4 // Increased bounciness
            }),
            linearDamping: 0.4, // Increased air resistance for faster stopping
            angularDamping: 0.5 // Increased rotational resistance for more stable turning
        });
        
        // Set initial rotation based on team
        if (this.team === 'orange') {
            this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
        }
        
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
        const particleCount = 100; // Doubled particle count for more impressive effect
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
                particle.mesh.position.addScaledVector(moveDirection, particle.speed * deltaTime * 15); // Increased speed
                
                // Update particle life
                particle.life -= deltaTime * 1.5; // Slower decay for longer trails
                
                // Update particle appearance
                particle.mesh.material.opacity = particle.life * 0.8;
                const scale = particle.life * 0.7 + 0.3; // Slower shrinking
                particle.mesh.scale.multiplyScalar(scale);
                
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
    }
    
    handleControls(deltaTime) {
        // Create a stable control reference frame that's decoupled from the car's rotation
        // This ensures consistent controls even when the car is flipping or barrel rolling
        
        // Get car's current quaternion
        const carQuaternion = new THREE.Quaternion(
            this.body.quaternion.x,
            this.body.quaternion.y,
            this.body.quaternion.z,
            this.body.quaternion.w
        );
        
        // Create a stabilized control frame that only considers Y-axis rotation (yaw)
        // Extract just the Y-rotation component to create a stable control reference
        const carEuler = new THREE.Euler().setFromQuaternion(carQuaternion, 'YXZ');
        const stableQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, carEuler.y, 0)
        );
        
        // Get stable forward and right directions using only the Y-rotation
        // This ensures left/right and forward/backward are always relative to the car's heading
        // regardless of its roll or pitch
        const stableForward = new THREE.Vector3(0, 0, 1).applyQuaternion(stableQuaternion);
        const stableRight = new THREE.Vector3(1, 0, 0).applyQuaternion(stableQuaternion);
        
        // Also get the actual car directions for reference
        const actualForward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuaternion);
        const actualRight = new THREE.Vector3(1, 0, 0).applyQuaternion(carQuaternion);
        
        // Calculate movement force based on controls
        let forwardForce = 0;
        if (this.controls.forward) {
            forwardForce = this.acceleration;
        } else if (this.controls.backward) {
            forwardForce = -this.braking;
        }
        
        // Apply forward/backward force using the stable forward direction
        // This ensures the car always moves in the direction it's facing, regardless of its roll
        if (forwardForce !== 0) {
            const force = stableForward.clone().multiplyScalar(forwardForce * deltaTime);
            
            // Apply force directly to velocity for more responsive controls
            this.body.velocity.x += force.x;
            this.body.velocity.y += force.y;
            this.body.velocity.z += force.z;
        }
        
        // Apply turning with more controlled force
        // Turning is always around the world Y-axis, not the car's local axis
        if (this.controls.left) {
            // Apply torque to turn left
            const turnForce = this.handling * (this.controls.drift ? 5 : 3);
            this.body.angularVelocity.y += turnForce * deltaTime * 30;
        } else if (this.controls.right) {
            // Apply torque to turn right
            const turnForce = -this.handling * (this.controls.drift ? 5 : 3);
            this.body.angularVelocity.y += turnForce * deltaTime * 30;
        }
        
        // Apply rotational stabilization to keep car flat when in the air
        if (!this.isOnGround()) {
            // Apply torque to level out the car (reduce x and z rotation)
            const currentRotation = new THREE.Euler().setFromQuaternion(this.mesh.quaternion);
            
            // Apply stronger counter-torque proportional to current rotation
            // Increased stabilization factor for more reliable self-righting
            this.body.angularVelocity.x -= currentRotation.x * 8 * deltaTime;
            this.body.angularVelocity.z -= currentRotation.z * 8 * deltaTime;
        }
        
        // Handle boost
        this.isBoosting = false;
        if (this.controls.boost) { // Removed boostAmount check for unlimited boost
            this.isBoosting = true;
            
            // Apply boost force in the car's forward direction
            const boostForce = stableForward.clone().multiplyScalar(this.boostForce * deltaTime);
            
            // Apply boost force
            this.body.applyForce(
                new CANNON.Vec3(boostForce.x, boostForce.y, boostForce.z),
                new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z)
            );
            
            // No boost consumption - unlimited boost
            // The boostAmount stays at 100 permanently
        }
        
        // Handle jump
        if (this.controls.jump && this.canJump && !this.isJumping) {
            // Apply jump force
            this.body.applyImpulse(
                new CANNON.Vec3(0, this.jumpForce, 0),
                new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z)
            );
            
            this.isJumping = true;
            this.canJump = false;
            this.jumpCooldown = this.jumpCooldownTime;
        } else if (!this.controls.jump) {
            this.isJumping = false;
        }
        
        // Calculate the current velocity in world space
        const worldVelocity = new THREE.Vector3(
            this.body.velocity.x,
            this.body.velocity.y,
            this.body.velocity.z
        );
        
        // Calculate the lateral velocity using the stable right direction
        // This ensures drift behavior is consistent regardless of car orientation
        const lateralVelocityMagnitude = worldVelocity.dot(stableRight);
        const lateralVelocity = stableRight.clone().multiplyScalar(lateralVelocityMagnitude);
        
        // Apply drift (reduce lateral friction)
        if (this.controls.drift) {
            // Apply reduced lateral friction when drifting
            this.body.applyForce(
                new CANNON.Vec3(
                    -lateralVelocity.x * 0.5,
                    0,
                    -lateralVelocity.z * 0.5
                ),
                new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z)
            );
        } else {
            // Apply stronger lateral friction when not drifting
            this.body.applyForce(
                new CANNON.Vec3(
                    -lateralVelocity.x * 3, // Increased from 2 to 3 for better handling
                    0,
                    -lateralVelocity.z * 3  // Increased from 2 to 3 for better handling
                ),
                new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z)
            );
        }
        
        // Apply additional drag when not accelerating to make car stop faster
        if (!this.controls.forward && !this.controls.backward && !this.controls.boost) {
            // Apply drag force opposite to velocity direction
            const dragFactor = 1.5; // Increased drag for faster stopping
            this.body.applyForce(
                new CANNON.Vec3(
                    -this.body.velocity.x * dragFactor,
                    0,
                    -this.body.velocity.z * dragFactor
                ),
                new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z)
            );
        }
        
        // Limit maximum speed - with boost exception
        const currentSpeed = worldVelocity.length();
        const effectiveMaxSpeed = this.isBoosting ? this.maxSpeed * 2 : this.maxSpeed; // Double max speed when boosting
        
        if (currentSpeed > effectiveMaxSpeed) {
            const limitFactor = effectiveMaxSpeed / currentSpeed;
            this.body.velocity.x *= limitFactor;
            this.body.velocity.z *= limitFactor;
            // Note: y velocity (vertical) is not limited to allow proper jumps
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
        this.boostAmount = 100;
        this.canJump = true;
        this.isJumping = false;
        this.jumpCooldown = 0;
        
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
