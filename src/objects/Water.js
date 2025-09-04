import * as THREE from 'three';
import waterVertexShader from '../shaders/water.vert?raw';
import waterFragmentShader from '../shaders/water.frag?raw';

export class Water extends THREE.Mesh {
  constructor(options = {}) {
    super();

    this.maxRipples = 10;
    this.rippleData = [];

    this.texture = new THREE.TextureLoader().load( "/journey/world-map.png" );
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    

    this.material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTexture: { value: this.texture },
        uTime: { value: 0 },
        time: { value: 0 }, // used for ripples
        radius: { value: options.radius },

        // Wave controls
        uWavesAmplitude: { value: 0.02 },
        uWavesFrequency: { value: 2.0 },
        uWavesPersistence: { value: 0.3 },
        uWavesLacunarity: { value: 2.18 },
        uWavesIterations: { value: 8 },
        uWavesSpeed: { value: 0.4 },
        

        // Ripple data
        rippleCenters: { value: Array(this.maxRipples).fill(new THREE.Vector3(0, 0, 0)) },
        rippleStartTimes: { value: new Array(this.maxRipples).fill(0) },
        rippleCount: { value: 0 },
        uRippleHeight: { value: 0.01 },
        uRippleSpeed: { value: 2.0},
        uRippleBase: { value: 40.0},
        uRippleFade: {value: 1.0},
        

        uGroundAmplitude: { value: 0.15 },

        // Optional colors for frag shader
        uOpacity: { value: 0.8 },
        uEnvironmentMap: { value: options.environmentMap },
        uTroughColor: { value: new THREE.Color('rgba(73, 152, 195, 1)') },
        uSurfaceColor: { value: new THREE.Color('rgba(155, 216, 192, 1)') },
        uPeakColor: { value: new THREE.Color('rgba(217, 234, 239, 1)') },
        uWaveColor: { value: new THREE.Color('rgba(187, 216, 224, 1)') },
        uPeakThreshold: { value: 0.01 },
        uPeakTransition: { value: 0.05 },
        uTroughThreshold: { value: -0.01 },
        uTroughTransition: { value: 0.15 },
        uShallowStart: { value: 0.0 },
        uShallowEnd: { value: 0.3 },
        uTexelSize: { value: new THREE.Vector2(1, 1) }, 
        uFresnelScale: { value: 0.5},
        uFresnelPower: { value: 0.02 }
        // uFresnelScale: { value: 0.0},
        // uFresnelPower: { value: 0.0 }
      },
      transparent: true,
      depthTest: true,
      side: THREE.DoubleSide
    });

    this.geometry = new THREE.SphereGeometry(options.radius, 2048, 2048);
  }

  addRipple(positionWorld, time) {
    const positionLocal = this.worldToLocal(positionWorld.clone());

    if (this.rippleData.length >= this.maxRipples) {
      this.rippleData.shift();
    }

    this.rippleData.push({ position: positionLocal, time });
    this.updateRippleUniforms();
  }

  updateRippleUniforms() {
    this.material.uniforms.rippleCount.value = this.rippleData.length;

    for (let i = 0; i < this.maxRipples; i++) {
      if (i < this.rippleData.length) {
        this.material.uniforms.rippleCenters.value[i] = this.rippleData[i].position.clone();
        this.material.uniforms.rippleStartTimes.value[i] = this.rippleData[i].time;
      } else {
        this.material.uniforms.rippleCenters.value[i] = new THREE.Vector3(0, 0, 0);
        this.material.uniforms.rippleStartTimes.value[i] = 0;
      }
    }

    this.material.uniforms.rippleCenters.needsUpdate = true;
    this.material.uniforms.rippleStartTimes.needsUpdate = true;
    this.material.uniforms.rippleCount.needsUpdate = true;
  }

  update(time) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.time.value = time; // used in ripple calculation
  }
}
