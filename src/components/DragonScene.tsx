import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

/**
 * Rigged dragon model flying a smooth closed loop that weaves above and
 * below the hero typography. Skeletal "flying" animation drives the wings;
 * the loop path + banking is driven here. Scroll progress (0..1) pushes the
 * dragon away from camera and shrinks it slightly.
 *
 * Model: "Animated Dragon Three Motion Loops" — credit: LasquetiSpice (Sketchfab).
 */

const MODEL_URL = "/models/dragon.glb";

// Desired nose-to-tail length in world units after normalization.
const TARGET_LENGTH = 4.0;

// Seconds for one full lap of the flight loop.
const LAP_SECONDS = 26;

// Widest horizontal reach of the flight loop (|x| of the side points) plus a
// margin for the dragon's body. Used to keep the dragon on the left/right
// edges. On narrow screens we additionally compress the loop horizontally
// (see PATH_X_* below) so the dragon can stay large while still fitting.
const PATH_RADIUS_X = 2.6;
const BODY_MARGIN_X = 1.4;

// Below this viewport aspect ratio the flight loop starts compressing
// horizontally; at/above it the loop keeps its full desktop width.
const PATH_X_FULL_ASPECT = 1.4;
// Never compress the loop narrower than this fraction of its full width.
const PATH_X_MIN_SCALE = 0.42;

// Closed flight loop: swings above (+y) and below (−y) the text band,
// pushed back in z on the high pass so it reads as crossing behind/in front.
// Kept inside roughly ±2.4 x so the dragon stays in frame at fov 38, z 7.5.
const PATH_POINTS = [
  new THREE.Vector3(2.2, 1.3, -1.6),
  new THREE.Vector3(0.0, 2.0, -2.6),
  new THREE.Vector3(-2.2, 1.1, -1.4),
  new THREE.Vector3(-2.6, -0.4, 0.9),
  new THREE.Vector3(-1.2, -1.7, 2.0),
  new THREE.Vector3(1.2, -1.8, 1.8),
  new THREE.Vector3(2.6, -0.5, 0.7),
];

function Dragon({ progress }: { progress: { current: number } }) {
  const group = useRef<THREE.Group>(null);
  const bankGroup = useRef<THREE.Group>(null);
  const scrollGroup = useRef<THREE.Group>(null);

  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(PATH_POINTS, true, "catmullrom", 0.6),
    []
  );

  // Normalize the model: center it and scale to TARGET_LENGTH.
  const { modelScale, modelOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return {
      modelScale: TARGET_LENGTH / maxDim,
      modelOffset: center.multiplyScalar(-1),
    };
  }, [scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Skinned bounds lag the animated pose; never let culling hide it.
        mesh.frustumCulled = false;
        // The spec-gloss → metal-rough conversion yields a material with so
        // many texture slots that low-end GPUs exceed their 16-unit limit and
        // silently drop the mesh. Rebuild with only the essential maps.
        const src = mesh.material as THREE.MeshStandardMaterial;
        if (src && !(mesh.material as THREE.MeshStandardMaterial & { __slim?: boolean }).__slim) {
          const slim = new THREE.MeshStandardMaterial({
            map: src.map ?? null,
            normalMap: src.normalMap ?? null,
            color: src.color ? src.color.clone() : new THREE.Color("#ffffff"),
            metalness: 0.25,
            roughness: 0.55,
            envMapIntensity: 1.1,
            // Wings are thin single-sided membranes — render both faces so
            // they don't vanish (leaving only the bones) when seen from below.
            side: THREE.DoubleSide,
          });
          (slim as THREE.MeshStandardMaterial & { __slim?: boolean }).__slim = true;
          mesh.material = slim;
        }
      }
    });
  }, [scene]);

  useEffect(() => {
    const fly = actions["flying"];
    if (!fly) return;
    fly.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.4).play();
    return () => {
      fly.fadeOut(0.2);
    };
  }, [actions]);

  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpAhead = useMemo(() => new THREE.Vector3(), []);
  const tmpMat = useMemo(() => new THREE.Matrix4(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  const tanAhead = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const bankRef = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Responsive framing (recomputed each frame so it tracks resizes):
    // on narrow/portrait screens compress the loop horizontally and scale the
    // whole scene up to the largest size that still fits — so the dragon reads
    // big on phones yet never leaves the screen. The size does NOT depend on
    // scroll, so the dragon stays a constant size as the page scrolls.
    const halfW = state.viewport.width / 2;
    const pathXScale = THREE.MathUtils.clamp(
      state.viewport.aspect / PATH_X_FULL_ASPECT,
      PATH_X_MIN_SCALE,
      1
    );
    const sceneScale = Math.min(
      1,
      halfW / (PATH_RADIUS_X * pathXScale + BODY_MARGIN_X)
    );

    const u = (t / LAP_SECONDS) % 1;
    const uAhead = (u + 0.02) % 1;

    curve.getPointAt(u, tmpPos);
    curve.getPointAt(uAhead, tmpAhead);
    // Narrow the loop horizontally on portrait screens.
    tmpPos.x *= pathXScale;
    tmpAhead.x *= pathXScale;

    if (group.current) {
      group.current.position.copy(tmpPos);

      // Face along the path, smoothed to kill Catmull-Rom jitter.
      tmpMat.lookAt(tmpAhead, tmpPos, up);
      targetQuat.setFromRotationMatrix(tmpMat);
      group.current.quaternion.slerp(targetQuat, Math.min(1, delta * 5));
    }

    // Bank into turns: roll proportional to how fast the tangent swings sideways.
    if (bankGroup.current) {
      curve.getTangentAt(u, tan);
      curve.getTangentAt(uAhead, tanAhead);
      side.crossVectors(tan, up).normalize();
      const turn = tanAhead.sub(tan).dot(side);
      const targetBank = THREE.MathUtils.clamp(-turn * 18, -0.55, 0.55);
      bankRef.current = THREE.MathUtils.lerp(bankRef.current, targetBank, Math.min(1, delta * 3));
      bankGroup.current.rotation.z = bankRef.current;
      // Gentle bob in time with wing beats.
      bankGroup.current.position.y = Math.sin(t * 2.1) * 0.08;
    }

    if (scrollGroup.current) {
      // Constant depth + responsive scale (no scroll dependence).
      scrollGroup.current.position.z = 0;
      scrollGroup.current.scale.setScalar(sceneScale);
    }
  });

  return (
    <group ref={scrollGroup}>
      <group ref={group}>
        <group ref={bankGroup}>
          <group scale={modelScale} position={modelOffset.clone().multiplyScalar(modelScale)}>
            <primitive object={scene} />
          </group>
        </group>
      </group>
    </group>
  );
}

// Module-scope preload kicks off the GLB fetch as soon as this module is
// evaluated. Guard for SSR: useGLTF.preload would call fetch() with a
// relative URL on the server, which throws (Node fetch needs an absolute URL).
if (typeof window !== "undefined") {
  useGLTF.preload(MODEL_URL);
}

export function DragonScene({ progress }: { progress: { current: number } }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 7.5], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Cinematic lighting: warm key, crimson rim, cool fill */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 7, 5]}
        intensity={2.0}
        color="#fff1d6"
        castShadow
      />
      <pointLight position={[-5, -1, 4]} intensity={1.6} color="#ff3344" />
      <pointLight position={[2, 4, -5]} intensity={1.1} color="#7faaff" />
      <pointLight position={[0, -3, 2]} intensity={0.6} color="#ffaa00" />

      <Suspense fallback={null}>
        <Dragon progress={progress} />
      </Suspense>
      {/* Environment is network-fetched; keep it in its own boundary so a
          slow/failed HDR download can never block the dragon. */}
      <Suspense fallback={null}>
        <Environment preset="sunset" />
      </Suspense>
    </Canvas>
  );
}
