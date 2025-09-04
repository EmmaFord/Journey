import * as THREE from 'three';
import landVertexShader from '../shaders/land.vert?raw';
import landFragmentShader from '../shaders/land.frag?raw';

export class Ground extends THREE.Mesh {
  constructor(options = {}) {
    super();
       
    this.texture = new THREE.TextureLoader().load( "/journey/world-map.png" );
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: landVertexShader,
      fragmentShader: landFragmentShader,
      uniforms: {
        uTexture: { value: options.texture },
        uTime: { value: 0 },
        uCausticsColor: { value: new THREE.Color('#ffffff') },
        uCausticsIntensity: { value: 0.1 },
        uCausticsScale: { value: 8.0 },
        uCausticsSpeed: { value: 1.0 },
        uCausticsThickness: { value: 0.4 },
        uCausticsOffset: { value: 0.75 },
        uCausticsFadeStart: { value: 0.0 },
        uCausticsFadeEnd: { value: 0.10 },
        uSandScale: { value: 200.0 },
        
        uTexture: { value: this.texture },


        uDuneFactor : { value: 1.0},
        uGroundAmplitude: { value: 0.15 },
        uGroundFrequency: { value: 1.07 },
        uGroundPersistence: { value: 0.3 },
        uGroundLacunarity: { value: 2.18 },
        uGroundIterations: { value: 8 },

        uSandColor1: { value: new THREE.Color('rgba(243, 224, 181, 1)') },
        uSandColor2: { value: new THREE.Color('rgba(252, 237, 209, 1)') }
      }
    });


    this.geometry = new THREE.SphereGeometry(options.radius*0.95, 2048, 2048);
  }

  update(time) {
    this.material.uniforms.uTime.value = time;
  }
} 