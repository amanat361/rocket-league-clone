/**
 * Ball class for creating and managing the game ball
 */
class Ball {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world; // Physics world
        this.mesh = null;
        this.body = null;
        this.radius = 5;
        this.mass = 1;
        this.restitution = 1.5; // Bounciness
        
        // Trail effect
        this.trail = [];
        this.maxTrailLength = 20;
        this.trailUpdateInterval = 3; // Update every N frames
        this.frameCount = 0;
        
        this.createBall();
    }
    
    createBall() {
        // Create ball geometry
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        
        // Create ball material
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.7,
            emissive: 0x222222
        });
        
        // Create ball mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Create ball physics body
        const shape = new CANNON.Sphere(this.radius);
        this.body = new CANNON.Body({
            mass: this.mass,
            position: new CANNON.Vec3(0, 20, 0), // Start above the ground
            shape: shape,
            material: new CANNON.Material({
                friction: 0.3,
                restitution: this.restitution
            }),
            linearDamping: 0.1, // Air resistance
            angularDamping: 0.1 // Rotational resistance
        });
        
        // Add initial velocity
        this.body.velocity.set(
            random(-10, 10),
            random(5, 15),
            random(-10, 10)
        );
        
        this.world.addBody(this.body);
        
        // Create trail effect
        this.createTrail();
    }
    
    createTrail() {
        // Create trail geometry and material
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        
        // Pre-create trail meshes
        for (let i = 0; i < this.maxTrailLength; i++) {
            const trailGeometry = new THREE.SphereGeometry(this.radius * 0.8, 16, 16);
            const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial.clone());
            trailMesh.visible = false;
            this.scene.add(trailMesh);
            this.trail.push({
                mesh: trailMesh,
                position: new THREE.Vector3(),
                life: 0
            });
        }
    }
    
    reset(position = new THREE.Vector3(0, 20, 0), velocity = null) {
        // Reset ball position
        this.body.position.copy(position);
        this.mesh.position.copy(position);
        
        // Reset ball velocity
        if (velocity) {
            this.body.velocity.copy(velocity);
        } else {
            this.body.velocity.set(
                random(-10, 10),
                random(5, 15),
                random(-10, 10)
            );
        }
        
        // Reset ball angular velocity
        this.body.angularVelocity.set(0, 0, 0);
        
        // Clear trail
        this.trail.forEach(segment => {
            segment.mesh.visible = false;
            segment.life = 0;
        });
    }
    
    applyImpulse(direction, force) {
        const impulse = direction.clone().normalize().multiplyScalar(force);
        this.body.applyImpulse(
            new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
            new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z)
        );
    }
    
    updateTrail() {
        // Only update trail every N frames for performance
        this.frameCount++;
        if (this.frameCount % this.trailUpdateInterval !== 0) return;
        
        // Add new trail segment
        const oldestSegment = this.trail.shift();
        oldestSegment.position.copy(this.mesh.position);
        oldestSegment.mesh.position.copy(this.mesh.position);
        oldestSegment.mesh.visible = true;
        oldestSegment.life = 1.0; // Full opacity
        this.trail.push(oldestSegment);
        
        // Update existing trail segments
        for (let i = 0; i < this.trail.length; i++) {
            const segment = this.trail[i];
            if (segment.life > 0) {
                segment.life -= 0.05;
                segment.mesh.material.opacity = segment.life * 0.3;
                
                // Scale down trail segments as they age
                const scale = 0.8 + (segment.life * 0.2);
                segment.mesh.scale.set(scale, scale, scale);
                
                if (segment.life <= 0) {
                    segment.mesh.visible = false;
                }
            }
        }
    }
    
    update() {
        // Update ball mesh position and rotation from physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
        
        // Update trail effect
        this.updateTrail();
        
        // Add glow effect based on velocity
        const speed = this.body.velocity.length();
        const maxSpeed = 50;
        const normalizedSpeed = Math.min(speed / maxSpeed, 1);
        
        // Adjust emissive color based on speed
        const emissiveIntensity = normalizedSpeed * 0.5;
        this.mesh.material.emissive.setRGB(
            emissiveIntensity,
            emissiveIntensity,
            emissiveIntensity
        );
        
        // Check if ball is out of bounds (fell through the floor)
        if (this.body.position.y < -50) {
            this.reset();
        }
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
