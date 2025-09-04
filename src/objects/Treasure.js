import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Treasure extends THREE.Group {
  constructor(options = {}) {
    super();
    this.options = options

    // Load boat model
    this.model;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(import.meta.env.BASE_URL + '/models/flag.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(0.1, 0.1, 0.1);
      this.model.traverse((child) => {
        if (child.isMesh) {
          const material = child.material;
          if (Array.isArray(material)) {
            material.forEach(mat => mat.side = THREE.DoubleSide);
          } else {
            material.side = THREE.DoubleSide;
          }
       }
  });
      this.add(this.model);
    });
  }

  showFlag(pos, quat) {
    if (!this.model) return;
    this.visible = true;
    this.model.visible = true;
    this.position.copy(pos);
    this.quaternion.copy(quat);
  }

}
