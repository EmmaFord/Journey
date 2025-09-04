precision highp float;

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
