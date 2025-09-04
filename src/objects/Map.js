import * as THREE from 'three';

export class Map extends THREE.Mesh {
  constructor(options = {}) {
    super();
       
    this.texture = new THREE.TextureLoader().load( "/journey/world-map.png" );
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.material = new THREE.MeshBasicMaterial({map: this.texture, opacity: 0.6, transparent: true});
    this.geometry = new THREE.SphereGeometry(options.radius*1.05, 2048, 2048);
  }

  update(time) {

  }
}  