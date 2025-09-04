import{d as t,T as a,R as o,h as u,c as e,i as r}from"./three-vendor-BkoL2XzL.js";const i=`precision highp float;

uniform float uGroundAmplitude;
uniform float uGroundFrequency;
uniform float uGroundPersistence;
uniform float uGroundLacunarity;
uniform float uGroundIterations;

uniform sampler2D uTexture;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv; // <<< ADDED

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
  float frequency = uGroundFrequency;
  
  for (float i = 0.0; i < 10.0; i++) {
    if (i >= uGroundIterations) break;
    elevation += amplitude * snoise(pos * frequency);
    amplitude *= uGroundPersistence;
    frequency *= uGroundLacunarity;
  }
  elevation *= uGroundAmplitude;
  return elevation;
}

float getElevationFromTexture(vec2 uv) {
    uv = 1.0 - uv;

    vec3 texColor = texture2D(uTexture, uv).rgb;
    float luminance = 1.0 - texColor.r;
    return luminance * uGroundAmplitude;
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  vec3 sphereDir = normalize(modelPosition.xyz);
  // Map 3D sphere direction to 2D UV coordinates
  vec2 uv = vec2(
    0.5 + atan(sphereDir.z, sphereDir.x) / (2.0 * 3.1415926),
    0.5 - asin(sphereDir.y) / 3.1415926
  );

  float elevation = getElevationFromTexture(uv);
  modelPosition.xyz += sphereDir * elevation;

  // Pass UV to fragment shader
  vUv = uv; // <<< ADDED

  float eps = 0.001;
  vec2 uvDx = vec2(uv.x + eps, uv.y);
  vec2 uvDz = vec2(uv.x, uv.y + eps);
  float dx = getElevationFromTexture(uvDx) - elevation;
  float dz = getElevationFromTexture(uvDz) - elevation;
  vec3 tangent = normalize(vec3(eps, dx, 0.0));
  vec3 bitangent = normalize(vec3(0.0, dz, eps));
  vec3 normal = normalize(cross(tangent, bitangent));

  vNormal = normal;
  vWorldPosition = modelPosition.xyz;

  gl_Position = projectionMatrix * viewMatrix * modelPosition;
  
}
`,v=`precision highp float;

uniform float uTime;
uniform vec3 uCausticsColor;
uniform float uCausticsIntensity;
uniform float uCausticsOffset;
uniform float uCausticsScale;
uniform float uCausticsSpeed;
uniform float uCausticsThickness;
uniform float uCausticsFadeStart;
uniform float uCausticsFadeEnd;

uniform float uGroundAmplitude;

uniform float uSandScale;
uniform float uDuneFactor;

uniform vec3 uSandColor1;
uniform vec3 uSandColor2;

uniform sampler2D uTexture; // Needed for getElevationFromTexture()

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv; // <<< RECEIVED FROM VERTEX

// Simplex 3D Noise
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(
    permute(
      permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
      i.y + vec4(0.0, i1.y, i2.y, 1.0)
    ) +
    i.x + vec4(0.0, i1.x, i2.x, 1.0)
  );
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(
    vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
  );
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(
    0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)),
    0.0
  );
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1),
                                dot(p2, x2), dot(p3, x3)));
}

// Use texture to get elevation
float getElevationFromTexture(vec2 uv) {
    uv = 1.0 - uv;

    vec3 texColor = texture2D(uTexture, uv).rgb;
    float luminance = 1.0 - texColor.r;
    return luminance * uGroundAmplitude;
}

void main() {
  vec3 normalizedPos = normalize(vWorldPosition);

  // Animated caustics using 3D noise directly
  vec3 causticsPos = vWorldPosition * uCausticsScale + uTime * uCausticsSpeed;
  float causticsVal = snoise(causticsPos);
  causticsVal = uCausticsOffset - abs(causticsVal);
  
  // Get elevation from texture
  float elevation = getElevationFromTexture(vUv);

  // Fade factor based on elevation
  float fade = 1.0 - smoothstep(uCausticsFadeStart, uCausticsFadeEnd, elevation);

  // Caustics strength including elevation fade
  float caustics = smoothstep(0.5 - uCausticsThickness, 0.5 + uCausticsThickness, causticsVal) 
                * uCausticsIntensity 
                * fade;

                
  // Static sand pattern tied to position and time
  float n = snoise(normalizedPos * uSandScale + uTime * 0.1);
  vec3 baseSand = mix(uSandColor1, uSandColor2, n * 0.5 + 0.5);

  // Simple dune shading
  float duneShade = 0.5 + 0.5 * uDuneFactor;
  vec3 baseColor = baseSand * (0.9 + 0.1 * duneShade);


  vec3 finalColor = baseColor + caustics * uCausticsColor;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;class l extends t{constructor(n={}){super(),this.texture=new a().load("/journey//world-map.png"),this.texture.wrapS=o,this.texture.wrapT=o,this.material=new u({vertexShader:i,fragmentShader:v,uniforms:{uTexture:{value:n.texture},uTime:{value:0},uCausticsColor:{value:new e("#ffffff")},uCausticsIntensity:{value:.1},uCausticsScale:{value:8},uCausticsSpeed:{value:1},uCausticsThickness:{value:.4},uCausticsOffset:{value:.75},uCausticsFadeStart:{value:0},uCausticsFadeEnd:{value:.1},uSandScale:{value:200},uTexture:{value:this.texture},uDuneFactor:{value:1},uGroundAmplitude:{value:.15},uGroundFrequency:{value:1.07},uGroundPersistence:{value:.3},uGroundLacunarity:{value:2.18},uGroundIterations:{value:8},uSandColor1:{value:new e("rgba(243, 224, 181, 1)")},uSandColor2:{value:new e("rgba(252, 237, 209, 1)")}}}),this.geometry=new r(n.radius*.95,2048,2048)}update(n){this.material.uniforms.uTime.value=n}}export{l as Ground};
//# sourceMappingURL=Ground-Crm9jS8Z.js.map
