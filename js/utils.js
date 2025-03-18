/**
 * Utility functions for the Rocket League clone
 */

// Convert degrees to radians
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

// Random number between min and max
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Check if two objects are colliding (simple sphere collision)
function checkCollision(obj1, obj2) {
    const distance = obj1.position.distanceTo(obj2.position);
    return distance < (obj1.radius + obj2.radius);
}

// Linear interpolation
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Clamp a value between min and max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Calculate direction vector from rotation
function directionFromRotation(rotation) {
    // Convert Euler rotation to direction vector
    const x = Math.sin(rotation.y) * Math.cos(rotation.x);
    const y = Math.sin(rotation.x);
    const z = Math.cos(rotation.y) * Math.cos(rotation.x);
    
    return new THREE.Vector3(x, y, z);
}
