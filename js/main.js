/**
 * Main entry point for the Rocket League clone
 */
import * as THREE from 'three';
import * as CANNON from 'cannon';
// Import Stats as a default export
const Stats = await import('./stats.min.js').then(module => module.default);
import { Game } from './game.js';
import { CSG } from './csg.js';

// Global variables
let scene, renderer, game;
let world, timeStep = 1/60;
let lastTime = 0;
let stats;

// Initialize the game
function init() {
    // Create Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create physics world
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Earth gravity
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.solver.iterations = 10;
    world.defaultContactMaterial.contactEquationStiffness = 1e6;
    world.defaultContactMaterial.contactEquationRelaxation = 3;
    
    // Create game instance
    game = new Game(scene, world);
    
    // Add performance stats (if in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        addStats();
    }
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Start animation loop
    animate();
}

// Animation loop
function animate(time = 0) {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;
    
    // Limit delta time to prevent large jumps
    const limitedDelta = Math.min(deltaTime, 0.1);
    
    // Update physics world
    world.step(timeStep, limitedDelta, 3);
    
    // Update game
    game.update(limitedDelta);
    
    // Render scene
    renderer.render(scene, game.camera);
    
    // Update stats
    if (stats) stats.update();
}

// Handle window resize
function onWindowResize() {
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update camera aspect ratio
    if (game && game.camera) {
        game.camera.aspect = window.innerWidth / window.innerHeight;
        game.camera.updateProjectionMatrix();
    }
}

// Add performance stats
function addStats() {
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.left = '0px';
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', init);
