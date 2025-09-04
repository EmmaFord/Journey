precision highp float;

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
