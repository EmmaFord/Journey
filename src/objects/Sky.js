import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

export class SkyGroup extends THREE.Group {
    constructor(options = {}) {
        super();

        this.sky = new Sky();
        this.sky.scale.setScalar( 450000 );

        this.elevation = 5;
        this.azimuth = 180;

        const phi = THREE.MathUtils.degToRad( 90 - this.elevation);
        const theta = THREE.MathUtils.degToRad( this.azimuth);
        const sunPosition = new THREE.Vector3().setFromSphericalCoords( 1, phi, theta );

        this.sky.material.uniforms.sunPosition.value = sunPosition;
        this.sky.material.uniforms.turbidity.value = 0.0;
        this.sky.material.uniforms.rayleigh.value = 2.0;

        this.add( this.sky );
        
    }



  update(time, water) {

  }
} 