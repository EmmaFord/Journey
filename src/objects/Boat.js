import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Boat extends THREE.Group {
  constructor(options = {}) {
    super();
    this.options = options;

    this.landImageData = null;

    // ✅ Load texture with default flipY=true (same as Map)
    const loader = new THREE.TextureLoader();
    loader.load(
      import.meta.env.BASE_URL +'world-map.png',
      (texture) => {
        const image = texture.image;
        texture.flipY = false;
        texture.flipX = false;


        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        this.landImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log("Land texture loaded (flipY = true).");
      },
      undefined,
      (err) => {
        console.error("Error loading land texture:", err);
      }
    );

    // Load boat model
    this.model;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(import.meta.env.BASE_URL + 'models/boat.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(0.0001, 0.0001, 0.0001);
      this.add(this.model);
    });

    // Debug cube
    this.cross = new THREE.Group()
    this.add(this.cross);


    this.geometry = new THREE.BoxGeometry(0.02, 0.02, 0.1);
    this.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0,0,0) });
    this.crossPart1 = new THREE.Mesh(this.geometry, this.material);
    this.crossPart1.position.y = 0.05;
    this.crossPart2 = new THREE.Mesh(this.geometry, this.material);
    this.crossPart2.rotation.y = Math.PI/2;
    this.crossPart2.position.y = 0.05;

    this.cross.add(this.crossPart1);
    this.cross.add(this.crossPart2);

    // Initial position
    this.boatPos = new THREE.Vector3(0, options.radius + options.boatScaleOffset, 0);
    this.boatForward = new THREE.Vector3(1, 0, 0);
    this.boatUp = this.boatPos.clone().normalize();

    this.position.copy(this.boatPos);
    this.lastBoatPos = this.boatPos.clone();
    this.moveSpeed = 0.01;
    this.turnSpeed = 0.1;
    this.keysPressed = {};





  }

  updateBoatPos() {
    this.position.copy(this.boatPos);
    this.up.copy(this.boatUp);
    const lookTarget = this.boatPos.clone().add(this.boatForward);
    this.lookAt(lookTarget);
  }

  moveAlongSphere(direction) {
    const axis = new THREE.Vector3().crossVectors(this.boatForward, this.boatUp).normalize();
    const angle = direction * this.moveSpeed;
    this.boatPos.applyAxisAngle(axis, angle).normalize().multiplyScalar(this.options.radius + this.options.boatScaleOffset);
    this.boatUp.copy(this.boatPos).normalize();
    this.boatForward = this.projectOnTangentPlane(this.boatForward, this.boatUp);
  }

  turnBoat(leftRight) {
    this.boatForward.applyAxisAngle(this.boatUp, leftRight * this.turnSpeed);
    this.boatForward.normalize();
  }

  projectOnTangentPlane(vec, normal) {
    return vec.clone().sub(normal.clone().multiplyScalar(vec.dot(normal))).normalize();
  }

  /**
   * Convert spherical direction to UV coordinates.
   * Adjusted to match THREE.TextureLoader's default (flipY = true).
   */
  sphericalDirToUV(dir) {
    let u =  0.5 - Math.atan2(dir.z, dir.x) / (2 * Math.PI)
    let v = 0.5 - Math.asin(dir.y) / Math.PI;
    return new THREE.Vector2(u, v);
  }

  getLuminanceAtUV(uv) {
    const imageData = this.landImageData;
    if (!imageData) return 0;

    const u = THREE.MathUtils.clamp(uv.x, 0, 1);
    const v = THREE.MathUtils.clamp(uv.y, 0, 1);

    const x = Math.floor(u * (imageData.width - 1));
    const y = Math.floor(v * (imageData.height - 1));
    const index = (y * imageData.width + x) * 4;
    const r = imageData.data[index];

    return 1.0 - r / 255;
  }

  update(time, water, treasure) {
    let moved = false;

    const dir = this.boatPos.clone().normalize();
    const uv = this.sphericalDirToUV(dir);
    const luminance = this.getLuminanceAtUV(uv);

    const groundAmplitude = 0.15;
    const land = luminance * groundAmplitude;
    const onLand = land > 0.01;
    //this.moveSpeed = onLand ? this.baseSpeed * 0.01 : this.baseSpeed;

    if(this.model != null){
      this.model.visible = onLand ? false : true;
    }
    this.cross.visible = onLand ? true : false;
    

    if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
      this.moveAlongSphere(+1);
      moved = true;
    }
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
      this.moveAlongSphere(-1);
      moved = true;
    }
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
      this.turnBoat(+1);
    }
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
      this.turnBoat(-1);
    }

    if (this.keysPressed[' '] && onLand) {
      console.log('space pressed ')

      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      this.getWorldPosition(worldPos);
      this.getWorldQuaternion(worldQuat);
      treasure.showFlag(worldPos, worldQuat);

    }

    if (moved && this.position.distanceTo(this.lastBoatPos) > 0.1) {
      this.lastBoatPos.copy(this.position);
      if(!onLand){
        water.addRipple(this.position.clone(), time);
      }
    }


    this.updateBoatPos();
  }
}
