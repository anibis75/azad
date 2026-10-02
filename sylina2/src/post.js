// Post-traitement : bloom + passe « cinéma » (flou radial, aberration chromatique, arrêt du temps,
// images d'impact inversées, écran fendu, onde de distorsion, grain, vignette)
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const CinemaShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uSpeed: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) }, uChroma: { value: 0.0015 },
    uMono: { value: 0 }, uInvert: { value: 0 }, uHard: { value: 0 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 1, 1) },
    uSplitA: { value: new THREE.Vector4(0.5, 0.5, 0, 0) }, uSplitB: { value: new THREE.Vector4(0.5, 0.5, 0, 0) },
    uGlowA: { value: 0 }, uGlowB: { value: 0 }, uColA: { value: new THREE.Color(1, 1, 1) }, uColB: { value: new THREE.Color(1, 1, 1) },
    uShock: { value: new THREE.Vector4(0.5, 0.5, 0, 0) }, uRing: { value: new THREE.Vector3(0.5, 0.5, 0) }, uFade: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uSpeed, uChroma, uMono, uInvert, uHard, uFlash, uGlowA, uGlowB, uFade;
    uniform vec2 uRes, uCenter; uniform vec3 uFlashCol, uColA, uColB, uRing; uniform vec4 uSplitA, uSplitB, uShock;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec2 split(vec2 uv, vec4 s){
      if (s.w == 0.0) return uv;
      vec2 d = vec2(cos(s.z), sin(s.z)), n = vec2(-d.y, d.x);
      vec2 p = (uv - s.xy) * uRes; float side = sign(dot(p, n));
      return uv + d * side * s.w / uRes;
    }
    float lineGlow(vec2 uv, vec4 s){
      vec2 d = vec2(cos(s.z), sin(s.z)), n = vec2(-d.y, d.x);
      float dist = abs(dot((uv - s.xy) * uRes, n));
      return exp(-dist * 0.25) + exp(-dist * 0.03) * 0.35;
    }
    void main(){
      vec2 uv = split(split(vUv, uSplitA), uSplitB);
      // onde de distorsion
      if (uShock.w > 0.0) {
        vec2 asp = vec2(uRes.x / uRes.y, 1.0);
        vec2 dv = (uv - uShock.xy) * asp; float dist = length(dv);
        float x = (dist - uShock.z) / 0.08;
        if (abs(x) < 1.0) uv -= normalize(dv) / asp * uShock.w * 0.035 * (1.0 - x * x) * x;
      }
      vec2 dir = uv - uCenter;
      vec3 col = vec3(0.0);
      float ca = uChroma + uSpeed * 0.01 + uHard * 0.006;
      const int N = 12;
      for (int i = 0; i < N; i++) {
        float t = float(i) / float(N - 1);
        vec2 o = -dir * t * uSpeed * 0.16;
        col.r += texture2D(tDiffuse, uv + o + dir * ca).r;
        col.g += texture2D(tDiffuse, uv + o).g;
        col.b += texture2D(tDiffuse, uv + o - dir * ca).b;
      }
      col /= float(N);
      // lignes des coupures
      col += uColA * lineGlow(vUv, uSplitA) * uGlowA * 2.0;
      col += uColB * lineGlow(vUv, uSplitB) * uGlowB * 2.0;
      // arrêt du temps : monochrome froid + anneau inversé
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 mono = vec3(l * 0.95, l * 1.0, l * 1.15);
      mono = (mono - 0.5) * 1.25 + 0.5;
      col = mix(col, mono, uMono);
      if (uRing.z > 0.0) {
        vec2 asp = vec2(uRes.x / uRes.y, 1.0);
        float d = length((vUv - uRing.xy) * asp);
        if (d < uRing.z) col = 1.0 - col;
      }
      // image d'impact (négatif / manga contrasté)
      if (uHard > 0.0) { float g = step(0.28, dot(col, vec3(0.333))); col = mix(col, vec3(g), uHard); }
      col = mix(col, 1.0 - col, uInvert);
      col += uFlashCol * uFlash;
      // vignette + grain
      float v = smoothstep(1.05, 0.35, length((vUv - 0.5) * vec2(1.25, 1.0)));
      col *= mix(0.55, 1.0, v);
      col += (hash(vUv * uRes + uTime * 61.0) - 0.5) * 0.045;
      col *= 1.0 - uFade;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function buildPost(renderer, scene, camera) {
  const sz = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(sz.x, sz.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.7, 0.5, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const cinema = new ShaderPass(CinemaShader);
  composer.addPass(cinema);
  return { composer, bloom, u: cinema.uniforms };
}
