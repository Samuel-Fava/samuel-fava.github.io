// src/Physx.js

import { engine } from './_physx/engine.js';  // Import the engine from your physics module
import { initializeEngine, simulatePhysics } from './_physx/engine.js';

initializeEngine();  // Initialize the physics engine

// Simulate physics on each frame (just an example)
function gameLoop(deltaTime) {
  simulatePhysics(deltaTime);
  requestAnimationFrame(gameLoop);
}

gameLoop(0.016);  // Call game loop with deltaTime (60 FPS)
