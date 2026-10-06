import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getAtlas, categoryColor, structureById } from '../../core/atlas/loader';
import { extractCenterline, resamplePolyline } from '../../core/atlas/tractPaths';
import { useBrain } from '../../state/store';

const HIGHLIGHT = new THREE.Color('#ffb020');
const HIGHLIGHT_GLOW = new THREE.Color('#ff9e00');
const FLOW = new THREE.Color('#00e5ff');
const FADE_OPACITY = 0.14;
// Emissive multiplier for the "waiting" (non-active) highlighted structures.
const HIGHLIGHT_EMISSIVE_INTENSITY = 2.4;
// Tract "flow" pulses: how many signal packets travel along each active tract.
const PULSES_PER_TRACT = 4;
const PULSE_RADIUS = 0.028;

/** Map GLB bx_id -> atlas structure metadata. */
function buildMeshMap() {
  const atlas = getAtlas();
  const map = new Map<number, { id: string; category: string; side: string }>();
  for (const s of atlas.structures) {
    map.set(s.bxId, { id: s.id, category: s.category, side: s.side });
  }
  return map;
}

/** category -> peel depth (outer=0 … inner=n). Unknown categories count as "deepest". */
function buildDepthIndex() {
  const atlas = getAtlas();
  const map = new Map<string, number>();
  atlas.depth.forEach((cat, i) => map.set(cat, i));
  return map;
}

/**
 * Group flow ids into "steps", merging left/right duplicates of the same
 * structure so bilateral regions light up simultaneously.
 */
function groupByLabel(ids: string[]): string[][] {
  const groups: string[][] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const label = structureById(id)?.label ?? id;
    if (seen.has(label)) continue;
    seen.add(label);
    groups.push(ids.filter((oid) => (structureById(oid)?.label ?? oid) === label));
  }
  return groups;
}

/** Centroid of a group of structures (world space), or null if unknown. */
function centroidOf(ids: string[], centroids: Map<string, THREE.Vector3>): THREE.Vector3 | null {
  const c = new THREE.Vector3();
  let n = 0;
  for (const id of ids) {
    const p = centroids.get(id);
    if (p) {
      c.add(p);
      n++;
    }
  }
  return n ? c.divideScalar(n) : null;
}

/** Orient a tract centerline so it flows from the stage's preceding structure
 * toward its following structure (source → target). */
function orientTractPath(
  base: THREE.Vector3[],
  beforeIds: string[],
  afterIds: string[],
  centroids: Map<string, THREE.Vector3>,
): THREE.Vector3[] {
  const before = centroidOf(beforeIds, centroids);
  const after = centroidOf(afterIds, centroids);
  if (!before && !after) return base;
  const start = base[0];
  const end = base[base.length - 1];
  const normal =
    (before ? start.distanceTo(before) : 0) + (after ? end.distanceTo(after) : 0);
  const flipped =
    (after ? start.distanceTo(after) : 0) + (before ? end.distanceTo(before) : 0);
  return flipped < normal ? base.slice().reverse() : base;
}

interface FocusTarget {
  camPos: THREE.Vector3;
  target: THREE.Vector3;
}

function BrainScene() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  // structureId -> [meshes] (a structure can map to several primitive meshes).
  const meshMap = useRef(new Map<string, THREE.Mesh[]>());
  const focusTarget = useRef<FocusTarget | null>(null);
  const flowTime = useRef(0);
  const flowGroupsRef = useRef<string[][]>([]);
  const flowGroupKeyRef = useRef('');
  const homeTarget = useRef(new THREE.Vector3(0, 0, 0));
  const homeCamPos = useRef(new THREE.Vector3(0, 0, 3.4));
  const homeReady = useRef(false);
  const cameraInitialized = useRef(false);
  // Radius of the core brain after scaling (≈1.7); used to keep the camera
  // outside the brain when focusing on deep structures.
  const coreRadius = useRef(1.7);
  // structureId -> centerline polyline (world space) for white-matter tracts.
  const tractPaths = useRef(new Map<string, THREE.Vector3[]>());
  // structureId -> world-space centroid (for orienting tract flow direction).
  const structureCentroid = useRef(new Map<string, THREE.Vector3>());
  // structureId -> pulse spheres travelling along that tract.
  const pulseMeshes = useRef(new Map<string, THREE.Mesh[]>());

  const gltf = useLoader(
    GLTFLoader,
    './models/brain.glb',
    (loader) => {
      const draco = new DRACOLoader();
      draco.setDecoderPath('./draco/');
      loader.setDRACOLoader(draco);
    },
  );

  // One-time scene setup. Multi-primitive meshes become Groups in three.js, with
  // the bx_id on the group's userData; we assign every descendant mesh of a
  // structure to that structure.
  useMemo(() => {
    // useLoader caches the same scene across view remounts, so the scene may
    // already carry a transform from a previous mount. Reset to identity first so
    // the box/center below are always computed from pristine coordinates (this
    // keeps the setup idempotent across Explore/Study/Quiz remounts).
    gltf.scene.scale.setScalar(1);
    gltf.scene.rotation.set(0, 0, 0);
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.updateMatrixWorld(true);

    const meshByBxId = buildMeshMap();
    const box = new THREE.Box3();
    const coreBox = new THREE.Box3();

    gltf.scene.traverse((o) => {
      const bxId = o.userData?.bx_id as number | undefined;
      if (bxId == null) return;
      const meta = meshByBxId.get(bxId);
      if (!meta) return;
      const color = new THREE.Color(categoryColor(meta.category));

      const meshes: THREE.Mesh[] = [];
      o.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
      });
      if (!meshes.length) return;

      for (const mesh of meshes) {
        mesh.userData.structureId = meta.id;
        mesh.userData.category = meta.category;
        mesh.userData.side = meta.side;
        mesh.userData.faded = false;
        mesh.userData.core = !!o.userData.bx_core;
        mesh.userData.baseColor = color.clone();
        mesh.material = new THREE.MeshStandardMaterial({
          color: color.clone(),
          roughness: 0.85,
          metalness: 0.0,
          transparent: false,
        });
        box.expandByObject(mesh);
        if (o.userData.bx_core) coreBox.expandByObject(mesh);
      }
      meshMap.current.set(meta.id, meshes);
    });

    // Frame on the core brain (excludes long peripheral nerves/vessels).
    const frameBox = coreBox.isEmpty() ? box : coreBox;
    const center = frameBox.getCenter(new THREE.Vector3());
    const radius = frameBox.getBoundingSphere(new THREE.Sphere()).radius || 1;
    const s = 1.7 / radius;
    coreRadius.current = radius * s;
    gltf.scene.scale.setScalar(s);
    gltf.scene.rotation.y = Math.PI;
    // Center the core at the origin, accounting for the 180° Y rotation.
    gltf.scene.position.set(s * center.x, -s * center.y, s * center.z);

    // Derive the home camera framing from the actual (world-space) core box so
    // it stays correct regardless of the transform.
    gltf.scene.updateMatrixWorld(true);

    // Build centroids for every structure (used to orient tract flow direction).
    for (const [id, meshes] of meshMap.current) {
      const b = new THREE.Box3();
      for (const m of meshes) b.expandByObject(m);
      if (!b.isEmpty()) structureCentroid.current.set(id, b.getCenter(new THREE.Vector3()));
    }

    // Extract centerline polylines for white-matter tracts and create the moving
    // "flow" pulse spheres that travel along them.
    const pulseGeometry = new THREE.SphereGeometry(PULSE_RADIUS, 10, 10);
    for (const [id, meshes] of meshMap.current) {
      const cat = meshes[0].userData.category as string;
      if (cat !== 'tracts') continue;
      const path = resamplePolyline(extractCenterline(meshes), 48);
      if (path.length < 2) continue;
      tractPaths.current.set(id, path);
      const spheres: THREE.Mesh[] = [];
      for (let i = 0; i < PULSES_PER_TRACT; i++) {
        const m = new THREE.Mesh(
          pulseGeometry,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color('#ffffff'),
            emissive: new THREE.Color(FLOW),
            emissiveIntensity: 4.0,
            roughness: 0.3,
            metalness: 0.0,
          }),
        );
        m.visible = false;
        m.renderOrder = 10;
        m.material.depthTest = false;
        gltf.scene.add(m);
        spheres.push(m);
      }
      pulseMeshes.current.set(id, spheres);
    }

    const homeBox = new THREE.Box3();
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && o.userData.core) homeBox.expandByObject(m);
    });
    if (homeBox.isEmpty()) homeBox.copy(frameBox).applyMatrix4(gltf.scene.matrixWorld);
    const hc = homeBox.getCenter(new THREE.Vector3());
    const hr = homeBox.getBoundingSphere(new THREE.Sphere()).radius || 1;
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const hdist = (hr / Math.sin(fov / 2)) * 1.0;
    homeTarget.current = hc;
    // The scene is rotated 180° about Y, so anterior (the face) faces world -Z;
    // place the home camera there so the initial view shows the front aspect.
    homeCamPos.current = hc.clone().add(new THREE.Vector3(0, 0, -1).multiplyScalar(hdist));
    homeReady.current = true;
  }, [gltf]);

  // Orbit controls.
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    controls.minDistance = 0.4;
    controls.maxDistance = 10;
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [camera, gl]);

  const depthIndex = useMemo(buildDepthIndex, []);

  const depthOf = (id: string): number => {
    const cat = meshMap.current.get(id)?.[0]?.userData.category as string | undefined;
    if (!cat) return -1;
    return depthIndex.get(cat) ?? Number.POSITIVE_INFINITY;
  };

  // Visibility + highlight colour (no fade — fade is driven dynamically per frame).
  useEffect(() => {
    const apply = (s: ReturnType<typeof useBrain.getState>) => {
      const highlighted = new Set([...s.highlightIds, s.selectedId ?? '']);
      for (const [id, meshes] of meshMap.current) {
        const cat = meshes[0].userData.category as string;
        const side = meshes[0].userData.side as string;
        const hidden =
          s.hiddenCategories.includes(cat) ||
          (s.hemisphere !== 'both' && side !== 'median' && side !== s.hemisphere);
        const isHighlighted = highlighted.has(id);
        for (const mesh of meshes) {
          mesh.visible = !hidden;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (isHighlighted) {
            mat.color.copy(HIGHLIGHT);
            mat.emissive.copy(HIGHLIGHT_GLOW);
            mat.emissiveIntensity = HIGHLIGHT_EMISSIVE_INTENSITY;
          } else {
            mat.color.copy(mesh.userData.baseColor as THREE.Color);
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0;
          }
        }
      }
    };
    apply(useBrain.getState());
    return useBrain.subscribe(apply);
  }, [depthIndex]);

  // Fade shallower layers to reveal deeper structures. Called every frame; only
  // recompiles a material when its faded state actually changes. In flow mode,
  // `sameDepthKeep` isolates the highlighted region by also fading non-highlighted
  // structures at the same depth (so a highlighted gyrus stands out from its
  // neighbouring cortex instead of sitting flush against it).
  const applyFade = (deepest: number, sameDepthKeep: Set<string> | null) => {
    for (const [id, meshes] of meshMap.current) {
      const cat = meshes[0].userData.category as string;
      const d = depthIndex.get(cat) ?? Number.POSITIVE_INFINITY;
      const faded =
        d < deepest || (sameDepthKeep !== null && d === deepest && !sameDepthKeep.has(id));
      for (const mesh of meshes) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mesh.userData.faded !== faded) {
          mesh.userData.faded = faded;
          mat.transparent = faded;
          mat.depthWrite = !faded;
          mat.needsUpdate = true;
        }
        mat.opacity = faded ? FADE_OPACITY : 1;
      }
    }
  };

  const applyFocus = (ids: string[]) => {
    gltf.scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    for (const id of ids) {
      const meshes = meshMap.current.get(id);
      if (meshes) for (const m of meshes) box.expandByObject(m);
    }
    if (box.isEmpty()) {
      console.warn('applyFocus: no meshes found for focus set', ids);
      return;
    }
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.2);
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const fitDist = (radius / Math.sin(fov / 2)) * 1.3;
    // Clamp so the camera never dives inside a small structure nor zooms out
    // farther than the home framing.
    const homeDist = homeCamPos.current.distanceTo(homeTarget.current) || 4.7;
    const dist = THREE.MathUtils.clamp(fitDist, 1.1, Math.max(homeDist, 1.1));
    let dir = camera.position.clone().sub(center);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    else dir.normalize();
    const camPos = center.clone().add(dir.multiplyScalar(dist));
    // Deep structures sit inside the brain; ensure the camera stays outside the
    // core sphere so it never renders the interior.
    const minFromOrigin = coreRadius.current * 1.5;
    if (camPos.length() < minFromOrigin) {
      camPos.normalize().multiplyScalar(minFromOrigin);
    }
    focusTarget.current = {
      target: center.clone(),
      camPos,
    };
  };

  const appliedFocusKey = useRef('');
  const lastActiveKeyRef = useRef('');
  // tractId -> flow-oriented centerline (cleared whenever the stage changes).
  const orientedPaths = useRef(new Map<string, THREE.Vector3[]>());

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (controls) controls.update();

    // On the first frame after the GLB is loaded, snap the camera to the home
    // framing so the initial view matches the home-reset view (no jump later).
    if (homeReady.current && !cameraInitialized.current) {
      cameraInitialized.current = true;
      camera.position.copy(homeCamPos.current);
      if (controls) controls.target.copy(homeTarget.current);
    }

    const state = useBrain.getState();
    const flowIds = state.flowIds;

    // Compute the active flow group (if animating). Bilateral structures are
    // grouped so both hemispheres pulse together.
    const flowPeriod = 2.2;
    let active: string[] = [];
    let pulse = 0;
    if (flowIds.length) {
      const flowKey = flowIds.join('|');
      if (flowKey !== flowGroupKeyRef.current) {
        flowGroupKeyRef.current = flowKey;
        flowTime.current = 0;
        flowGroupsRef.current = groupByLabel(flowIds);
        orientedPaths.current.clear();
      }
      const groups = flowGroupsRef.current;
      const idx = Math.floor(flowTime.current / flowPeriod) % groups.length;
      const phase = (flowTime.current / flowPeriod) % 1;
      pulse = Math.sin(phase * Math.PI);
      active = groups[idx];
      flowTime.current += delta;
    }

    // Publish the active flow group to the store (only on change, not per-frame)
    // so the study sidebar can highlight the matching structure labels in sync.
    {
      const activeKey = active.length ? active.slice().sort().join('|') : '';
      if (activeKey !== lastActiveKeyRef.current) {
        lastActiveKeyRef.current = activeKey;
        useBrain.getState().setFlowActive(active.length ? active.slice() : []);
      }
    }

    // Camera focus: follow the active flow group when animating (so the camera
    // zooms to the region being lit up), else honor an explicit focus request,
    // else return home.
    const focusTargetIds = active.length ? active : state.focusIds.length ? state.focusIds : null;
    if (focusTargetIds) {
      const key = focusTargetIds.slice().sort().join('|');
      if (key !== appliedFocusKey.current) {
        appliedFocusKey.current = key;
        applyFocus(focusTargetIds);
      }
    } else if (appliedFocusKey.current !== '') {
      appliedFocusKey.current = '';
      focusTarget.current = {
        target: homeTarget.current.clone(),
        camPos: homeCamPos.current.clone(),
      };
    }

    // Colors + progressive fade.
    let effectiveDeepest = -1;
    let sameDepthKeep: Set<string> | null = null;
    if (flowIds.length) {
      for (const id of flowIds) {
        const meshes = meshMap.current.get(id);
        if (!meshes) continue;
        const isActive = active.includes(id);
        for (const mesh of meshes) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (isActive) {
            // Active structures stay clearly cyan (not lerping back to amber), so
            // the "currently firing" region is unambiguous; only the glow pulses.
            mat.color.copy(FLOW);
            mat.emissive.copy(FLOW);
            mat.emissiveIntensity = 1.4 + 2.2 * pulse;
          } else {
            mat.color.copy(HIGHLIGHT);
            mat.emissive.copy(HIGHLIGHT_GLOW);
            mat.emissiveIntensity = HIGHLIGHT_EMISSIVE_INTENSITY;
          }
        }
      }
      for (const id of active) {
        effectiveDeepest = Math.max(effectiveDeepest, depthOf(id));
      }
      sameDepthKeep = new Set(flowIds);
    } else {
      for (const id of [...state.highlightIds, state.selectedId ?? '']) {
        effectiveDeepest = Math.max(effectiveDeepest, depthOf(id));
      }
    }
    applyFade(effectiveDeepest, sameDepthKeep);

    // Animate "flow" pulses along active white-matter tracts, oriented from the
    // stage's preceding structure toward its following structure.
    {
      const groups = flowGroupsRef.current;
      const groupIdx = active.length
        ? Math.floor(flowTime.current / flowPeriod) % groups.length
        : -1;
      const tmp = new THREE.Vector3();
      for (const id of active) {
        const spheres = pulseMeshes.current.get(id);
        const base = tractPaths.current.get(id);
        if (!spheres || !base) continue;
        let path = orientedPaths.current.get(id);
        if (!path) {
          const beforeIds = groupIdx > 0 ? groups[groupIdx - 1] : [];
          const afterIds = groupIdx >= 0 && groupIdx < groups.length - 1 ? groups[groupIdx + 1] : [];
          path = orientTractPath(base, beforeIds, afterIds, structureCentroid.current);
          orientedPaths.current.set(id, path);
        }
        for (let i = 0; i < spheres.length; i++) {
          const t = (flowTime.current / flowPeriod + i / spheres.length) % 1;
          const f = t * (path.length - 1);
          const i0 = Math.floor(f);
          const i1 = Math.min(i0 + 1, path.length - 1);
          tmp.copy(path[i0]).lerp(path[i1], f - i0);
          spheres[i].position.copy(tmp);
          spheres[i].visible = true;
        }
      }
      for (const [id, spheres] of pulseMeshes.current) {
        if (active.includes(id)) continue;
        for (const s of spheres) s.visible = false;
      }
    }

    const ft = focusTarget.current;
    if (ft) {
      const k = 0.12;
      if (controls) controls.target.lerp(ft.target, k);
      camera.position.lerp(ft.camPos, k);
      if (camera.position.distanceTo(ft.camPos) < 0.01) focusTarget.current = null;
    }
  });

  const handlePick = (e: ThreeEvent<MouseEvent>) => {
    // Walk sorted intersections, skipping faded occluders AND hidden (toggled-off)
    // layers, so clicks land on the intended, visible structure.
    const hits = e.intersections ?? [];
    for (const hit of hits) {
      const mesh = hit.object as THREE.Mesh;
      const id = mesh.userData?.structureId as string | null;
      if (id && !mesh.userData.faded && mesh.visible !== false) {
        useBrain.getState().select(id);
        return;
      }
    }
    const id = (e.object as THREE.Mesh).userData?.structureId as string | null;
    if (id) useBrain.getState().select(id);
  };

  return <primitive object={gltf.scene} onClick={handlePick} />;
}

export function BrainViewer({ className }: { className?: string }) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, -3.4], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="Interactive 3D brain model"
      role="img"
    >
      <color attach="background" args={['#0c1018']} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 6]} intensity={1.4} />
      <directionalLight position={[-4, -2, -4]} intensity={0.4} />
      <Suspense fallback={null}>
        <BrainScene />
      </Suspense>
    </Canvas>
  );
}
