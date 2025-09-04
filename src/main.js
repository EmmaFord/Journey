import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

camera.position.set(2, 2, -6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
scene.add(directionalLight);
const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 1.0);
hemiLight.position.set(0, 6, 0);
scene.add(hemiLight);

// Environment map setup
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath(import.meta.env.BASE_URL);
const environmentMap = cubeTextureLoader.load([
  'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'
]);
scene.background = environmentMap;
scene.environment = environmentMap;

// Texture loader for pool texture
const poolTexture = new THREE.TextureLoader().load(import.meta.env.BASE_URL+ '/ocean_floor.png');

const clock = new THREE.Clock();
const radius = 2;
const boatScaleOffset = 0.03;

// Declare variables for dynamic objects
let boat, treasure, water, ground;

// Dynamic imports for heavy objects
async function loadObjects() {
  const [{ Boat }, { Treasure }, { Water }, { Ground }, { setupUI }] = await Promise.all([
    import('./objects/Boat'),
    import('./objects/Treasure'),
    import('./objects/Water'),
    import('./objects/Ground'),
    import('./ui')
  ]);

  boat = new Boat({ radius, boatScaleOffset });
  treasure = new Treasure();

  scene.add(boat);
  scene.add(treasure);

  const waterResolution = { size: 512 };

  water = new Water({
    environmentMap,
    radius,
    resolution: waterResolution.size,
  });
  scene.add(water);

  ground = new Ground({
    texture: poolTexture,
    radius,
  });
  scene.add(ground);

  setupUI({ waterResolution, water, ground });

  animate();
}

window.addEventListener('keydown', e => {
  e.preventDefault();
  if (boat) boat.keysPressed[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
  if (boat) boat.keysPressed[e.key.toLowerCase()] = false;
});

function animate() {
  const elapsedTime = clock.getElapsedTime();

  if (water) water.update(elapsedTime);
  if (ground) ground.update(elapsedTime);
  if (boat && treasure) boat.update(elapsedTime, water, treasure);
  controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loading objects dynamically
loadObjects();
