import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from './objects/Water';
import { Ground } from './objects/Ground';
import { setupUI } from './ui';
import { Boat } from './objects/Boat';
import { Treasure } from './objects/Treasure';

// Animation
const clock = new THREE.Clock();
let radius = 2;
const boatScaleOffset = 0.03;


// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const boat = new Boat({
  radius,
  boatScaleOffset,

});
scene.add(boat);


const treasure = new Treasure();
scene.add(treasure);

// Environment map
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath('/journey/');
const environmentMap = cubeTextureLoader.load([
  'px.png', // positive x
  'nx.png', // negative x 
  'py.png', // positive y
  'ny.png', // negative y
  'pz.png', // positive z
  'nz.png'  // negative z
]);

const poolTexture = new THREE.TextureLoader().load('/journey/ocean_floor.png');

scene.background = environmentMap;
scene.environment = environmentMap;

// Camera position
camera.position.set(radius, radius, -radius*3);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Add some light to see the ground material
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

// Add some light to see the ground material
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
scene.add(directionalLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 1.0); // sky color, ground color, intensity
hemiLight.position.set(0, radius * 3, 0);
scene.add(hemiLight);

const waterResolution = { size: 512 };
const water = new Water({
  environmentMap,
  radius,
  resolution: waterResolution.size,
});
scene.add(water);

const ground = new Ground({
  texture: poolTexture,
  radius
});
scene.add(ground);


window.addEventListener('keydown', e => {
  e.preventDefault();
  boat.keysPressed[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
  boat.keysPressed[e.key.toLowerCase()] = false;
});

function animate() {
  const elapsedTime = clock.getElapsedTime();

  water.update(elapsedTime);
  ground.update(elapsedTime);
  boat.update(elapsedTime, water, treasure);
  controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
setupUI({ waterResolution, water, ground});
