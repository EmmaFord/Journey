import { Pane } from 'tweakpane';
import * as THREE from 'three';


export function setupUI({ waterResolution, water, ground }) {
  const pane = new Pane();

  // Water parameters folder
  const waterFolder = pane.addFolder({ title: 'Water' });;
  waterFolder.expanded = false;

  const geometryFolder = waterFolder.addFolder({ title: 'Geometry' });
 

  geometryFolder.addBinding(waterResolution, 'size', { min: 2, max: 1024, step: 2, label: 'Resolution' }).on('change', ({ value }) => {
    console.log(value);
    // Update geometry with new dimensions
    const newGeometry = new THREE.PlaneGeometry(
      2,
      2,
      waterResolution.size,
      waterResolution.size
    );
    water.geometry.dispose();
    water.geometry = newGeometry;
  });

  // Waves
  const wavesFolder = waterFolder.addFolder({ title: 'Waves' });
  wavesFolder.addBinding(water.material.uniforms.uWavesAmplitude, 'value', {
    min: 0, max: 0.1, label: 'Amplitude'
  });
  wavesFolder.addBinding(water.material.uniforms.uWavesFrequency, 'value', {
    min: 0.1, max: 10, label: 'Frequency'
  });
  wavesFolder.addBinding(water.material.uniforms.uWavesPersistence, 'value', {
    min: 0, max: 1, label: 'Persistence'
  });
  wavesFolder.addBinding(water.material.uniforms.uWavesLacunarity, 'value', {
    min: 0, max: 3, label: 'Lacunarity'
  });
  wavesFolder.addBinding(water.material.uniforms.uWavesIterations, 'value', {
    min: 1, max: 10, step: 1, label: 'Iterations'
  });

  //Ripples (change with boat movement)
  const rippleFolder = waterFolder.addFolder({ title: 'Ripples' });
  rippleFolder.addBinding(water.material.uniforms.uRippleSpeed, 'value', {
    min: 0, max: 5, label: 'Speed'
  });
  rippleFolder.addBinding(water.material.uniforms.uRippleHeight, 'value', {
    min: 0, max: 0.5, label: 'Height'
  });
  rippleFolder.addBinding(water.material.uniforms.uRippleBase, 'value', {
    min: 0, max: 100.00, label: 'Base'
  });
  rippleFolder.addBinding(water.material.uniforms.uRippleFade, 'value', {
    min: 0, max: 10.0, label: 'Fade'
  });



  // Color
  const colorFolder = waterFolder.addFolder({ title: 'Color' });

  colorFolder.addBinding(water.material.uniforms.uOpacity, 'value', {
    min: 0, max: 1, step: 0.01, label: 'Opacity'
  });

  colorFolder.addBinding(water.material.uniforms.uTroughColor, 'value', {
    label: 'Trough Color', view: 'color', color: { type: 'float' }
  });
  colorFolder.addBinding(water.material.uniforms.uSurfaceColor, 'value', {
    label: 'Surface Color', view: 'color', color: { type: 'float' }
  });
  
  colorFolder.addBinding(water.material.uniforms.uPeakColor, 'value', {
    label: 'Peak Color',
    view: 'color',
    color: { type: 'float' }
  });
  
  colorFolder.addBinding(water.material.uniforms.uPeakThreshold, 'value', {
    min: 0.00,
    max: 0.02,
    label: 'Peak Threshold'
  });
  colorFolder.addBinding(water.material.uniforms.uPeakTransition, 'value', {
    min: 0,
    max: -1.0,
    label: 'Peak Transition'
  });
  colorFolder.addBinding(water.material.uniforms.uTroughThreshold, 'value', {
    min: -0.02,
    max: 0,
    label: 'Trough Threshold'
  });
  colorFolder.addBinding(water.material.uniforms.uTroughTransition, 'value', {
    min: 0,
    max: 2.0,
    label: 'Trough Transition'
  });

  
  colorFolder.addBinding(water.material.uniforms.uWaveColor, 'value', {
    label: 'Wave Color', view: 'color', color: { type: 'float' }
  });

  // Fresnel
  const fresnelFolder = waterFolder.addFolder({ title: 'Fresnel' });
  fresnelFolder.addBinding(water.material.uniforms.uFresnelScale, 'value', {
    min: 0,
    max: 1,
    label: 'Scale'
  });
  fresnelFolder.addBinding(water.material.uniforms.uFresnelPower, 'value', {
    min: 0,
    max: 3,
    label: 'Power'
  });

  //Land
  const landFolder = pane.addFolder({ title: 'Land' });
  landFolder.expanded = false;

  // Add Caustics controls
  const causticsFolder = landFolder.addFolder({ title: 'Caustics' });
  causticsFolder.addBinding(ground.material.uniforms.uCausticsColor, 'value', {
    label: 'Color',
    view: 'color',
    color: { type: 'float' }
  });
  causticsFolder.addBinding(ground.material.uniforms.uCausticsIntensity, 'value', {
    min: 0,
    max: 2,
    label: 'Intensity'
  });
  causticsFolder.addBinding(ground.material.uniforms.uCausticsScale, 'value', {
    min: 0,
    max: 200,
    label: 'Scale'
  });
  causticsFolder.addBinding(ground.material.uniforms.uCausticsSpeed, 'value', {
    min: 0,
    max: 1,
    label: 'Speed'
  });
  causticsFolder.addBinding(ground.material.uniforms.uCausticsOffset, 'value', {
    min: 0,
    max: 2,
    label: 'Offset'
  });
  causticsFolder.addBinding(ground.material.uniforms.uCausticsThickness, 'value', {
    min: 0,
    max: 1,
    label: 'Thickness'
  });
  causticsFolder.addBinding(ground.material.uniforms.uCausticsFadeStart, 'value', {
    min: 0,
    max: 1,
    label: 'Fade Start'
  });
  causticsFolder.addBinding(ground.material.uniforms.uCausticsFadeEnd, 'value', {
    min: 0,
    max: 1,
    label: 'FadeEnd'
  });





  //Ground

  const groundFolder = landFolder.addFolder({ title: 'Ground' });
  groundFolder.addBinding(ground.material.uniforms.uGroundAmplitude, 'value', {
    min: 0, max: 0.5, label: 'Amplitude'
  }).on('change', ({ value }) => {
    water.material.uniforms.uGroundAmplitude.value = value;
  });
  groundFolder.addBinding(ground.material.uniforms.uGroundFrequency, 'value', {
    min: 0.1, max: 20, label: 'Frequency'
  });
  groundFolder.addBinding(ground.material.uniforms.uGroundPersistence, 'value', {
    min: 0, max: 20, label: 'Persistence'
  });
  groundFolder.addBinding(ground.material.uniforms.uGroundLacunarity, 'value', {
    min: 0, max: 20, label: 'Lacunarity'
  });
  groundFolder.addBinding(ground.material.uniforms.uGroundIterations, 'value', {
    min: 1, max: 20, step: 1, label: 'Iterations'
  });
  groundFolder.addBinding(ground.material.uniforms.uSandScale, 'value', {
    min: 0,
    max: 400,
    label: 'Scale'
  });

  groundFolder.addBinding(ground.material.uniforms.uSandColor1, 'value', {
    label: 'Sand Color1',
    view: 'color',
    color: { type: 'float' }
  });

  groundFolder.addBinding(ground.material.uniforms.uSandColor2, 'value', {
    label: 'Sand Color2',
    view: 'color',
    color: { type: 'float' }
  });
  

  //Sky
  const skyFolder = pane.addFolder({ title: 'Sky' });
  // skyFolder.addBinding(SkyGroup.sky.material.uniforms.turbidity, 'value', {
  //   min: 0,
  //   max: 20.0,
  //   label: 'Turbidity'
  // });



}