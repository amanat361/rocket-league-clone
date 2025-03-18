/**
 * Stadium class for creating and managing the game arena
 */
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { CSG } from './csg.js';

export class Stadium {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world; // Physics world
        this.mesh = null;
        this.walls = [];
        this.goals = {
            blue: null,
            orange: null
        };
        
        this.dimensions = {
            width: 300,    // X-axis (increased from 200)
            height: 80,    // Y-axis (increased from 60)
            length: 450,   // Z-axis (increased from 300)
            wallThickness: 5
        };
        
        this.createStadium();
    }
    
    createStadium() {
        // Create the floor
        this.createFloor();
        
        // Create the walls
        this.createWalls();
        
        // Create the goals
        this.createGoals();
        
        // Add ceiling
        this.createCeiling();
        
        // Add field markings
        this.createFieldMarkings();
    }
    
    createFloor() {
        // Create floor geometry
        const floorGeometry = new THREE.BoxGeometry(
            this.dimensions.width, 
            this.dimensions.wallThickness, 
            this.dimensions.length
        );
        
        // Create floor material
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.8
        });
        
        // Create floor mesh
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.position.y = -this.dimensions.wallThickness / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);
        
        // Add floor to physics world
        const floorShape = new CANNON.Box(new CANNON.Vec3(
            this.dimensions.width / 2,
            this.dimensions.wallThickness / 2,
            this.dimensions.length / 2
        ));
        
        const floorBody = new CANNON.Body({
            mass: 0, // Static body
            position: new CANNON.Vec3(0, -this.dimensions.wallThickness / 2, 0),
            shape: floorShape,
            material: new CANNON.Material({ friction: 0.3, restitution: 0.4 })
        });
        
        this.world.addBody(floorBody);
    }
    
    createWalls() {
        // Create gradient wall materials
        const blueWallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1976d2,
            roughness: 0.6,
            metalness: 0.2
        });
        
        const orangeWallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf57c00,
            roughness: 0.6,
            metalness: 0.2
        });
        
        // Side walls (along Z-axis)
        for (let i = -1; i <= 1; i += 2) {
            const sideWallGeometry = new THREE.BoxGeometry(
                this.dimensions.wallThickness,
                this.dimensions.height,
                this.dimensions.length
            );
            
            // Use blue for left wall, orange for right wall
            const wallMaterial = i < 0 ? blueWallMaterial : orangeWallMaterial;
            
            const sideWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
            sideWall.position.set(
                i * (this.dimensions.width / 2 + this.dimensions.wallThickness / 2),
                this.dimensions.height / 2,
                0
            );
            sideWall.castShadow = true;
            sideWall.receiveShadow = true;
            this.scene.add(sideWall);
            this.walls.push(sideWall);
            
            // Add to physics world
            const sideWallShape = new CANNON.Box(new CANNON.Vec3(
                this.dimensions.wallThickness / 2,
                this.dimensions.height / 2,
                this.dimensions.length / 2
            ));
            
            const sideWallBody = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(
                    i * (this.dimensions.width / 2 + this.dimensions.wallThickness / 2),
                    this.dimensions.height / 2,
                    0
                ),
                shape: sideWallShape
            });
            
            this.world.addBody(sideWallBody);
        }
        
        // End walls (along X-axis, excluding goal areas)
        const goalWidth = 40; // Increased from 30
        const goalHeight = 30; // Increased from 20
        
        for (let i = -1; i <= 1; i += 2) {
            // Choose material based on which end (blue or orange)
            const endWallMaterial = i < 0 ? blueWallMaterial : orangeWallMaterial;
            
            // Left section of end wall
            const leftEndWallGeometry = new THREE.BoxGeometry(
                (this.dimensions.width - goalWidth) / 2,
                this.dimensions.height,
                this.dimensions.wallThickness
            );
            
            const leftEndWall = new THREE.Mesh(leftEndWallGeometry, endWallMaterial);
            leftEndWall.position.set(
                -(this.dimensions.width + goalWidth) / 4,
                this.dimensions.height / 2,
                i * (this.dimensions.length / 2 + this.dimensions.wallThickness / 2)
            );
            leftEndWall.castShadow = true;
            leftEndWall.receiveShadow = true;
            this.scene.add(leftEndWall);
            this.walls.push(leftEndWall);
            
            // Right section of end wall
            const rightEndWallGeometry = new THREE.BoxGeometry(
                (this.dimensions.width - goalWidth) / 2,
                this.dimensions.height,
                this.dimensions.wallThickness
            );
            
            const rightEndWall = new THREE.Mesh(rightEndWallGeometry, endWallMaterial);
            rightEndWall.position.set(
                (this.dimensions.width + goalWidth) / 4,
                this.dimensions.height / 2,
                i * (this.dimensions.length / 2 + this.dimensions.wallThickness / 2)
            );
            rightEndWall.castShadow = true;
            rightEndWall.receiveShadow = true;
            this.scene.add(rightEndWall);
            this.walls.push(rightEndWall);
            
            // Top section of end wall (above goal)
            const topEndWallGeometry = new THREE.BoxGeometry(
                goalWidth,
                this.dimensions.height - goalHeight,
                this.dimensions.wallThickness
            );
            
            const topEndWall = new THREE.Mesh(topEndWallGeometry, endWallMaterial);
            topEndWall.position.set(
                0,
                goalHeight + (this.dimensions.height - goalHeight) / 2,
                i * (this.dimensions.length / 2 + this.dimensions.wallThickness / 2)
            );
            topEndWall.castShadow = true;
            topEndWall.receiveShadow = true;
            this.scene.add(topEndWall);
            this.walls.push(topEndWall);
            
            // Add to physics world
            // Left section
            const leftEndWallShape = new CANNON.Box(new CANNON.Vec3(
                (this.dimensions.width - goalWidth) / 4,
                this.dimensions.height / 2,
                this.dimensions.wallThickness / 2
            ));
            
            const leftEndWallBody = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(
                    -(this.dimensions.width + goalWidth) / 4,
                    this.dimensions.height / 2,
                    i * (this.dimensions.length / 2 + this.dimensions.wallThickness / 2)
                ),
                shape: leftEndWallShape
            });
            
            this.world.addBody(leftEndWallBody);
            
            // Right section
            const rightEndWallShape = new CANNON.Box(new CANNON.Vec3(
                (this.dimensions.width - goalWidth) / 4,
                this.dimensions.height / 2,
                this.dimensions.wallThickness / 2
            ));
            
            const rightEndWallBody = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(
                    (this.dimensions.width + goalWidth) / 4,
                    this.dimensions.height / 2,
                    i * (this.dimensions.length / 2 + this.dimensions.wallThickness / 2)
                ),
                shape: rightEndWallShape
            });
            
            this.world.addBody(rightEndWallBody);
            
            // Top section
            const topEndWallShape = new CANNON.Box(new CANNON.Vec3(
                goalWidth / 2,
                (this.dimensions.height - goalHeight) / 2,
                this.dimensions.wallThickness / 2
            ));
            
            const topEndWallBody = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(
                    0,
                    goalHeight + (this.dimensions.height - goalHeight) / 2,
                    i * (this.dimensions.length / 2 + this.dimensions.wallThickness / 2)
                ),
                shape: topEndWallShape
            });
            
            this.world.addBody(topEndWallBody);
        }
    }
    
    createGoals() {
        const goalHeight = 30; // Increased from 20
        
        // Create blue goal (at negative Z)
        this.createGoal('blue', new THREE.Vector3(0, goalHeight / 2, -(this.dimensions.length / 2)));
        
        // Create orange goal (at positive Z)
        this.createGoal('orange', new THREE.Vector3(0, goalHeight / 2, this.dimensions.length / 2));
    }
    
    createGoal(team, position) {
        const goalWidth = 40; // Increased from 30
        const goalHeight = 30; // Increased from 20
        const goalDepth = 20; // Increased from 15
        
        // Goal color based on team
        const goalColor = team === 'blue' ? 0x0066ff : 0xff6600;
        
        // Create goal frame
        const goalMaterial = new THREE.MeshStandardMaterial({ 
            color: goalColor,
            roughness: 0.5,
            metalness: 0.7
        });
        
        // Create a group to hold all goal parts
        const goalGroup = new THREE.Group();
        goalGroup.position.copy(position);
        
        // Position the goal
        const zOffset = team === 'blue' ? -goalDepth / 2 : goalDepth / 2;
        goalGroup.position.z += zOffset;
        
        // Create the 5 sides of the goal (leaving the front open)
        const wallThickness = this.dimensions.wallThickness;
        
        // 1. Bottom panel
        const bottomGeometry = new THREE.BoxGeometry(goalWidth, wallThickness, goalDepth);
        const bottomMesh = new THREE.Mesh(bottomGeometry, goalMaterial);
        bottomMesh.position.y = -goalHeight / 2 + wallThickness / 2;
        bottomMesh.castShadow = true;
        bottomMesh.receiveShadow = true;
        goalGroup.add(bottomMesh);
        
        // 2. Top panel
        const topGeometry = new THREE.BoxGeometry(goalWidth, wallThickness, goalDepth);
        const topMesh = new THREE.Mesh(topGeometry, goalMaterial);
        topMesh.position.y = goalHeight / 2 - wallThickness / 2;
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
        goalGroup.add(topMesh);
        
        // 3. Left panel
        const leftGeometry = new THREE.BoxGeometry(wallThickness, goalHeight, goalDepth);
        const leftMesh = new THREE.Mesh(leftGeometry, goalMaterial);
        leftMesh.position.x = -goalWidth / 2 + wallThickness / 2;
        leftMesh.castShadow = true;
        leftMesh.receiveShadow = true;
        goalGroup.add(leftMesh);
        
        // 4. Right panel
        const rightGeometry = new THREE.BoxGeometry(wallThickness, goalHeight, goalDepth);
        const rightMesh = new THREE.Mesh(rightGeometry, goalMaterial);
        rightMesh.position.x = goalWidth / 2 - wallThickness / 2;
        rightMesh.castShadow = true;
        rightMesh.receiveShadow = true;
        goalGroup.add(rightMesh);
        
        // 5. Back panel
        const backGeometry = new THREE.BoxGeometry(goalWidth, goalHeight, wallThickness);
        const backMesh = new THREE.Mesh(backGeometry, goalMaterial);
        const backPanelZOffset = team === 'blue' ? -goalDepth / 2 + wallThickness / 2 : goalDepth / 2 - wallThickness / 2;
        backMesh.position.z = backPanelZOffset;
        backMesh.castShadow = true;
        backMesh.receiveShadow = true;
        goalGroup.add(backMesh);
        
        // Add the goal group to the scene
        this.scene.add(goalGroup);
        
        // Store the goal
        this.goals[team] = goalGroup;
        
        // Add goal to physics world
        // We'll create 5 bodies: bottom, top, back, left, right
        
        // Bottom
        const bottomShape = new CANNON.Box(new CANNON.Vec3(
            goalWidth / 2,
            this.dimensions.wallThickness / 2,
            goalDepth / 2
        ));
        
        const bottomBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(
                position.x,
                position.y - goalHeight / 2 + this.dimensions.wallThickness / 2,
                position.z + zOffset
            ),
            shape: bottomShape
        });
        
        this.world.addBody(bottomBody);
        
        // Top
        const topShape = new CANNON.Box(new CANNON.Vec3(
            goalWidth / 2,
            this.dimensions.wallThickness / 2,
            goalDepth / 2
        ));
        
        const topBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(
                position.x,
                position.y + goalHeight / 2 - this.dimensions.wallThickness / 2,
                position.z + zOffset
            ),
            shape: topShape
        });
        
        this.world.addBody(topBody);
        
        // Back
        const backShape = new CANNON.Box(new CANNON.Vec3(
            goalWidth / 2,
            goalHeight / 2,
            this.dimensions.wallThickness / 2
        ));
        
        const backZOffset = team === 'blue' ? 
            -goalDepth + this.dimensions.wallThickness / 2 : 
            goalDepth - this.dimensions.wallThickness / 2;
        
        const backBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(
                position.x,
                position.y,
                position.z + backZOffset
            ),
            shape: backShape
        });
        
        this.world.addBody(backBody);
        
        // Left side
        const leftShape = new CANNON.Box(new CANNON.Vec3(
            this.dimensions.wallThickness / 2,
            goalHeight / 2,
            goalDepth / 2
        ));
        
        const leftBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(
                position.x - goalWidth / 2 + this.dimensions.wallThickness / 2,
                position.y,
                position.z + zOffset
            ),
            shape: leftShape
        });
        
        this.world.addBody(leftBody);
        
        // Right side
        const rightShape = new CANNON.Box(new CANNON.Vec3(
            this.dimensions.wallThickness / 2,
            goalHeight / 2,
            goalDepth / 2
        ));
        
        const rightBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(
                position.x + goalWidth / 2 - this.dimensions.wallThickness / 2,
                position.y,
                position.z + zOffset
            ),
            shape: rightShape
        });
        
        this.world.addBody(rightBody);
    }
    
    createCeiling() {
        // Create ceiling geometry
        const ceilingGeometry = new THREE.BoxGeometry(
            this.dimensions.width, 
            this.dimensions.wallThickness, 
            this.dimensions.length
        );
        
        // Create a gradient ceiling material
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x673ab7, // Deep purple
            roughness: 0.6,
            metalness: 0.3,
            transparent: true,
            opacity: 0.7
        });
        
        // Create ceiling mesh
        this.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        this.ceiling.position.y = this.dimensions.height + this.dimensions.wallThickness / 2;
        this.ceiling.receiveShadow = true;
        this.scene.add(this.ceiling);
        
        // Add some colored spotlights for more visual interest
        this.addColoredLights();
        
        // Add ceiling to physics world
        const ceilingShape = new CANNON.Box(new CANNON.Vec3(
            this.dimensions.width / 2,
            this.dimensions.wallThickness / 2,
            this.dimensions.length / 2
        ));
        
        const ceilingBody = new CANNON.Body({
            mass: 0, // Static body
            position: new CANNON.Vec3(
                0, 
                this.dimensions.height + this.dimensions.wallThickness / 2, 
                0
            ),
            shape: ceilingShape
        });
        
        this.world.addBody(ceilingBody);
    }
    
    createFieldMarkings() {
        // Create field markings texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const context = canvas.getContext('2d');
        
        // Create a colorful gradient background
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a237e');    // Deep blue
        gradient.addColorStop(0.5, '#303f9f');  // Medium blue
        gradient.addColorStop(1, '#3949ab');    // Light blue
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a grid pattern
        context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        context.lineWidth = 2;
        
        // Vertical grid lines
        const gridSize = 64;
        for (let x = 0; x <= canvas.width; x += gridSize) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y <= canvas.height; y += gridSize) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }
        
        // Draw center circle
        context.strokeStyle = '#ffffff';
        context.lineWidth = 5;
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 8, 0, Math.PI * 2);
        context.stroke();
        
        // Fill center circle with semi-transparent white
        context.fillStyle = 'rgba(255, 255, 255, 0.1)';
        context.fill();
        
        // Draw center line
        context.beginPath();
        context.moveTo(0, canvas.height / 2);
        context.lineTo(canvas.width, canvas.height / 2);
        context.stroke();
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.5, 3); // Increased to match larger arena size
        
        // Apply texture to floor
        this.floor.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            metalness: 0.2
        });
    }
    
    // Check if ball is in a goal and return the team that scored
    checkGoal(ballPosition) {
        const goalWidth = 40; // Increased from 30
        const goalHeight = 30; // Increased from 20
        const goalDepth = 20; // Increased from 15
        
        // Check blue goal (negative Z)
        if (
            ballPosition.x > -goalWidth / 2 &&
            ballPosition.x < goalWidth / 2 &&
            ballPosition.y < goalHeight &&
            ballPosition.z < -(this.dimensions.length / 2) &&
            ballPosition.z > -(this.dimensions.length / 2 + goalDepth)
        ) {
            return 'orange'; // Orange team scored in blue goal
        }
        
        // Check orange goal (positive Z)
        if (
            ballPosition.x > -goalWidth / 2 &&
            ballPosition.x < goalWidth / 2 &&
            ballPosition.y < goalHeight &&
            ballPosition.z > (this.dimensions.length / 2) &&
            ballPosition.z < (this.dimensions.length / 2 + goalDepth)
        ) {
            return 'blue'; // Blue team scored in orange goal
        }
        
        return null; // No goal
    }
    
    addColoredLights() {
        // Add colored spotlights around the stadium for visual interest
        const spotlightColors = [
            0xff1744, // Red
            0x2979ff, // Blue
            0x00e676, // Green
            0xffea00, // Yellow
            0xd500f9  // Purple
        ];
        
        // Create spotlights at various positions - scaled up for larger arena
        const spotlightPositions = [
            { x: -120, y: 60, z: -150 },
            { x: 120, y: 60, z: -150 },
            { x: -120, y: 60, z: 150 },
            { x: 120, y: 60, z: 150 },
            { x: 0, y: 60, z: 0 }
        ];
        
        spotlightPositions.forEach((pos, index) => {
            const color = spotlightColors[index % spotlightColors.length];
            
            // Create spotlight
            const spotlight = new THREE.SpotLight(color, 0.8);
            spotlight.position.set(pos.x, pos.y, pos.z);
            spotlight.target.position.set(0, 0, 0);
            spotlight.angle = Math.PI / 6;
            spotlight.penumbra = 0.3;
            spotlight.decay = 1;
            spotlight.distance = 500; // Increased from 300 for larger arena
            spotlight.castShadow = true;
            
            // Configure shadow properties
            spotlight.shadow.mapSize.width = 1024;
            spotlight.shadow.mapSize.height = 1024;
            spotlight.shadow.camera.near = 10;
            spotlight.shadow.camera.far = 500; // Increased from 300 for larger arena
            
            this.scene.add(spotlight);
            this.scene.add(spotlight.target);
        });
    }
    
    update() {
        // Any stadium animations or updates can go here
    }
}
