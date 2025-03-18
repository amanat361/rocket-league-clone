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
            width: 200,    // X-axis (increased from 120)
            height: 60,    // Y-axis (increased from 40)
            length: 300,   // Z-axis (increased from 200)
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
            material: new CANNON.Material({ friction: 0.05, restitution: 0.4 })
        });
        
        this.world.addBody(floorBody);
    }
    
    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.7
        });
        
        // Side walls (along Z-axis)
        for (let i = -1; i <= 1; i += 2) {
            const sideWallGeometry = new THREE.BoxGeometry(
                this.dimensions.wallThickness,
                this.dimensions.height,
                this.dimensions.length
            );
            
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
            // Left section of end wall
            const leftEndWallGeometry = new THREE.BoxGeometry(
                (this.dimensions.width - goalWidth) / 2,
                this.dimensions.height,
                this.dimensions.wallThickness
            );
            
            const leftEndWall = new THREE.Mesh(leftEndWallGeometry, wallMaterial);
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
            
            const rightEndWall = new THREE.Mesh(rightEndWallGeometry, wallMaterial);
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
            
            const topEndWall = new THREE.Mesh(topEndWallGeometry, wallMaterial);
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
        
        // Create goal box
        const goalGeometry = new THREE.BoxGeometry(goalWidth, goalHeight, goalDepth);
        const goalMesh = new THREE.Mesh(goalGeometry, goalMaterial);
        
        // Position the goal
        const zOffset = team === 'blue' ? -goalDepth / 2 : goalDepth / 2;
        goalMesh.position.set(position.x, position.y, position.z + zOffset);
        
        // Make the goal hollow by scaling inner cube and using CSG
        const innerGeometry = new THREE.BoxGeometry(
            goalWidth - this.dimensions.wallThickness * 2, 
            goalHeight - this.dimensions.wallThickness * 2, 
            goalDepth
        );
        
        const innerMesh = new THREE.Mesh(innerGeometry);
        innerMesh.position.copy(goalMesh.position);
        
        // Use CSG to create hollow goal
        const goalCSG = CSG.fromMesh(goalMesh);
        const innerCSG = CSG.fromMesh(innerMesh);
        const hollowGoal = CSG.toMesh(
            goalCSG.subtract(innerCSG),
            goalMesh.matrix,
            goalMesh.material
        );
        
        hollowGoal.castShadow = true;
        hollowGoal.receiveShadow = true;
        this.scene.add(hollowGoal);
        
        // Store the goal
        this.goals[team] = hollowGoal;
        
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
        
        // Create ceiling material
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        // Create ceiling mesh
        this.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        this.ceiling.position.y = this.dimensions.height + this.dimensions.wallThickness / 2;
        this.ceiling.receiveShadow = true;
        this.scene.add(this.ceiling);
        
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
        
        // Fill with dark color
        context.fillStyle = '#222222';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw center circle
        context.strokeStyle = '#ffffff';
        context.lineWidth = 5;
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 8, 0, Math.PI * 2);
        context.stroke();
        
        // Draw center line
        context.beginPath();
        context.moveTo(0, canvas.height / 2);
        context.lineTo(canvas.width, canvas.height / 2);
        context.stroke();
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 2);
        
        // Apply texture to floor
        this.floor.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8
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
    
    update() {
        // Any stadium animations or updates can go here
    }
}
