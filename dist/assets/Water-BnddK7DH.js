import{d as t,T as l,R as a,h as s,V as i,c as n,g as u,i as p}from"./three-vendor-BkoL2XzL.js";const v=`precision highp float;

uniform float uTime;

uniform float uWavesAmplitude;
uniform float uWavesSpeed;
uniform float uWavesFrequency;
uniform float uWavesPersistence;
uniform float uWavesLacunarity;
uniform float uWavesIterations;

uniform float time;
uniform int rippleCount;
uniform float uRippleHeight;
uniform float uRippleSpeed;
uniform float uRippleBase;
uniform float uRippleFade;


const int MAX_RIPPLES = 10;

uniform vec3 rippleCenters[MAX_RIPPLES];
uniform float rippleStartTimes[MAX_RIPPLES];

uniform float radius;

varying vec3 vNormal;
varying vec3 vWorldPosition;

varying float vElevation;

uniform sampler2D uTexture;

//	Simplex 2D Noise 
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float sphericalDistance(vec3 a, vec3 b) {
  float dotProd = dot(normalize(a), normalize(b));
  return acos(clamp(dotProd, -1.0, 1.0));
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, 
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) 
                 + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Elevation (fBM-style noise)
float getElevation(float x, float z) {
  vec2 pos = vec2(x, z);
  float elevation = 0.0;
  float amplitude = 1.0;
  float frequency = uWavesFrequency;
  
  for (float i = 0.0; i < 10.0; i++) {
    if (i >= uWavesIterations) break;
    elevation += amplitude * snoise(pos * frequency + uTime * uWavesSpeed);
    amplitude *= uWavesPersistence;
    frequency *= uWavesLacunarity;
  }
  elevation *= uWavesAmplitude;
  vElevation = elevation;
  return elevation;
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  vec3 sphereDir = normalize(modelPosition.xyz);
  float elevation = getElevation(sphereDir.x, sphereDir.z);
  modelPosition.xyz += sphereDir * elevation;

  // Approximate normal
  float eps = 0.001;
  float dx = getElevation(sphereDir.x + eps, sphereDir.z) - elevation;
  float dz = getElevation(sphereDir.x, sphereDir.z + eps) - elevation;
  vec3 tangent = normalize(vec3(eps, dx, 0.0));
  vec3 bitangent = normalize(vec3(0.0, dz, eps));
  vec3 normal = normalize(cross(tangent, bitangent));

  vNormal = normal;
  vWorldPosition = modelPosition.xyz;

  float displacement = 0.0;

  for (int i = 0; i < MAX_RIPPLES; i++) {
    if (i >= rippleCount) break;
    float age = time - rippleStartTimes[i];
    if (age < 0.0) continue;

    float dist = sphericalDistance(position, rippleCenters[i]);
    float rippleRadius = age * uRippleSpeed;
    float delta = dist - rippleRadius;

    if (abs(delta) < 0.35) {
      float baseWave = cos(delta * 20.0);
      float secondaryWave = 0.3 * cos(delta * uRippleBase);
      float wave = baseWave + secondaryWave;

      float fade = smoothstep(0.35, 0.25, abs(delta));
      float ageFade = exp(-age * uRippleFade);

      float noiseVal = snoise(vWorldPosition.xz * 5.0 + time * 2.0);
      noiseVal = (noiseVal + 1.0) / 2.0;

      displacement += wave * fade * ageFade * uRippleHeight * (0.7 + 0.3 * noiseVal);
    }
  }

  vec3 displacedPosition = normalize(position) * (radius + elevation + displacement);

  modelPosition.xyz = displacedPosition;
  gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
`,m=`precision highp float;

uniform float uOpacity;

uniform vec3 uTroughColor;
uniform vec3 uSurfaceColor;
uniform vec3 uPeakColor;

uniform float uPeakThreshold;
uniform float uPeakTransition;
uniform float uTroughThreshold;
uniform float uTroughTransition;
uniform float uGroundAmplitude;

uniform float uFresnelScale;
uniform float uFresnelPower;

uniform sampler2D uTexture;
uniform samplerCube uEnvironmentMap;

uniform vec2 uTexelSize;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;

void main() {
    // --- Compute UV from world position on sphere
    vec3 sphereDir = normalize(vWorldPosition);
    float lat = asin(sphereDir.y);
    float lon = atan(sphereDir.z, sphereDir.x);
    vec2 uv = vec2(
        0.5 + lon / (2.0 * 3.14159265359),
        0.5 - lat / 3.14159265359
    );

    // --- Reflection & Fresnel
    vec3 viewDir = normalize(vWorldPosition);
    vec3 reflectedDir = reflect(viewDir, vNormal);
    reflectedDir.x *= -1.0;

    vec4 reflectionColor = textureCube(uEnvironmentMap, reflectedDir);

    float fresnel = uFresnelScale * pow(1.0 - clamp(dot(viewDir, vNormal), 0.0, 1.0), uFresnelPower);

    // --- Elevation-based gradient from procedural elevation
    float elevation = vElevation;

    float troughFactor = smoothstep(
        uTroughThreshold - uTroughTransition,
        uTroughThreshold + uTroughTransition,
        elevation
    );

    float peakFactor = smoothstep(
        uPeakThreshold - uPeakTransition,
        uPeakThreshold + uPeakTransition,
        elevation
    );

    // --- Base water color
    vec3 baseColor = mix(uTroughColor, uSurfaceColor, troughFactor);
    baseColor = mix(baseColor, uPeakColor, peakFactor);

    // --- Final Fresnel reflection blending
    vec3 waterColor = mix(baseColor, reflectionColor.rgb, fresnel);

    // --- Output
    gl_FragColor = vec4(waterColor, uOpacity);
}
`;class d extends t{constructor(e={}){super(),this.maxRipples=10,this.rippleData=[],this.texture=new l().load("/journey//world-map.png"),this.texture.wrapS=a,this.texture.wrapT=a,this.material=new s({vertexShader:v,fragmentShader:m,uniforms:{uTexture:{value:this.texture},uTime:{value:0},time:{value:0},radius:{value:e.radius},uWavesAmplitude:{value:.02},uWavesFrequency:{value:2},uWavesPersistence:{value:.3},uWavesLacunarity:{value:2.18},uWavesIterations:{value:8},uWavesSpeed:{value:.4},rippleCenters:{value:Array(this.maxRipples).fill(new i(0,0,0))},rippleStartTimes:{value:new Array(this.maxRipples).fill(0)},rippleCount:{value:0},uRippleHeight:{value:.01},uRippleSpeed:{value:2},uRippleBase:{value:40},uRippleFade:{value:1},uGroundAmplitude:{value:.15},uOpacity:{value:.75},uEnvironmentMap:{value:e.environmentMap},uTroughColor:{value:new n("rgba(79, 158, 200, 1)")},uSurfaceColor:{value:new n("rgba(155, 216, 192, 1)")},uPeakColor:{value:new n("rgba(217, 234, 239, 1)")},uWaveColor:{value:new n("rgba(187, 216, 224, 1)")},uPeakThreshold:{value:.01},uPeakTransition:{value:.05},uTroughThreshold:{value:-.01},uTroughTransition:{value:.15},uFresnelScale:{value:.5},uFresnelPower:{value:.02}},transparent:!0,depthTest:!0,side:u}),this.geometry=new p(e.radius,2048,2048)}addRipple(e,o){const r=this.worldToLocal(e.clone());this.rippleData.length>=this.maxRipples&&this.rippleData.shift(),this.rippleData.push({position:r,time:o}),this.updateRippleUniforms()}updateRippleUniforms(){this.material.uniforms.rippleCount.value=this.rippleData.length;for(let e=0;e<this.maxRipples;e++)e<this.rippleData.length?(this.material.uniforms.rippleCenters.value[e]=this.rippleData[e].position.clone(),this.material.uniforms.rippleStartTimes.value[e]=this.rippleData[e].time):(this.material.uniforms.rippleCenters.value[e]=new i(0,0,0),this.material.uniforms.rippleStartTimes.value[e]=0);this.material.uniforms.rippleCenters.needsUpdate=!0,this.material.uniforms.rippleStartTimes.needsUpdate=!0,this.material.uniforms.rippleCount.needsUpdate=!0}update(e){this.material.uniforms.uTime.value=e,this.material.uniforms.time.value=e}}export{d as Water};
//# sourceMappingURL=Water-BnddK7DH.js.map
