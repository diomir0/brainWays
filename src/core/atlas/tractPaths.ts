// Extract a centerline polyline from a tract's mesh volume(s), so we can animate
// "information flow" along white-matter pathways in the 3D viewer.
//
// Approach: collect the tract's world-space vertices, find its principal axis via
// a small PCA, slice the vertices into bins along that axis, and take each bin's
// centroid. The ordered centroids trace the tract's centerline even through gentle
// curves (e.g. the corticospinal tract bending through the internal capsule).

import * as THREE from 'three';

function pcaAxis(pts: THREE.Vector3[]): THREE.Vector3 {
  const n = pts.length;
  const c = new THREE.Vector3();
  for (const p of pts) c.add(p);
  c.divideScalar(n);

  // 3x3 covariance matrix.
  const cov = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const p of pts) {
    const x = p.x - c.x;
    const y = p.y - c.y;
    const z = p.z - c.z;
    cov[0] += x * x;
    cov[1] += x * y;
    cov[2] += x * z;
    cov[4] += y * y;
    cov[5] += y * z;
    cov[8] += z * z;
  }
  cov[3] = cov[1];
  cov[6] = cov[2];
  cov[7] = cov[5];

  // Power iteration for the dominant eigenvector.
  const v = new THREE.Vector3(1, 1, 1).normalize();
  for (let iter = 0; iter < 24; iter++) {
    const nx = cov[0] * v.x + cov[1] * v.y + cov[2] * v.z;
    const ny = cov[3] * v.x + cov[4] * v.y + cov[5] * v.z;
    const nz = cov[6] * v.x + cov[7] * v.y + cov[8] * v.z;
    v.set(nx, ny, nz);
    const len = v.length();
    if (len < 1e-12) break;
    v.divideScalar(len);
  }
  return v;
}

/** Extract an ordered world-space centerline from the given meshes. */
export function extractCenterline(meshes: THREE.Mesh[], numSlices = 36): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const tmp = new THREE.Vector3();
  for (const mesh of meshes) {
    const geo = mesh.geometry;
    if (!geo || !geo.getAttribute) continue;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!pos) continue;
    for (let i = 0; i < pos.count; i++) {
      tmp.fromBufferAttribute(pos, i);
      tmp.applyMatrix4(mesh.matrixWorld);
      pts.push(tmp.clone());
    }
  }
  if (pts.length < 4) return [];

  const axis = pcaAxis(pts);
  const projections = pts.map((p) => p.dot(axis));
  let min = Infinity;
  let max = -Infinity;
  for (const t of projections) {
    if (t < min) min = t;
    if (t > max) max = t;
  }
  const span = max - min;
  if (span < 1e-6) return [];

  const bins: THREE.Vector3[][] = Array.from({ length: numSlices }, () => []);
  for (let i = 0; i < pts.length; i++) {
    const t = (projections[i] - min) / span;
    const bin = Math.min(numSlices - 1, Math.floor(t * numSlices));
    bins[bin].push(pts[i]);
  }

  const out: THREE.Vector3[] = [];
  for (const bin of bins) {
    if (!bin.length) continue;
    const c = new THREE.Vector3();
    for (const p of bin) c.add(p);
    c.divideScalar(bin.length);
    out.push(c);
  }
  return out;
}

/** Resample a polyline to a target number of evenly-spaced points (by arc length). */
export function resamplePolyline(pts: THREE.Vector3[], targetCount: number): THREE.Vector3[] {
  if (pts.length < 2) return pts;
  const seg: number[] = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += pts[i].distanceTo(pts[i - 1]);
    seg.push(total);
  }
  if (total < 1e-6) return [pts[0], pts[pts.length - 1]];

  const out: THREE.Vector3[] = [];
  for (let k = 0; k < targetCount; k++) {
    const target = (total * k) / (targetCount - 1);
    // find segment
    let i = 0;
    while (i < seg.length - 2 && seg[i + 1] < target) i++;
    const segLen = seg[i + 1] - seg[i] || 1e-6;
    const f = (target - seg[i]) / segLen;
    out.push(new THREE.Vector3().lerpVectors(pts[i], pts[i + 1], f));
  }
  return out;
}
