import { getCenter, getBorderPoint, getBorderNormal, NODE_H } from "../utils/geometry";

const CORNER_R = 7;

/**
 * Build an SVG path string from waypoints with rounded corners.
 * At each interior corner, a quadratic bezier smooths the turn.
 * Only convex corners are rounded; near-collinear corners are passed through.
 */
function roundedPolyline(pts, r) {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

  let d = `M${pts[0].x},${pts[0].y}`;

  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const n = pts[i + 1];

    const v1x = p.x - c.x;
    const v1y = p.y - c.y;
    const v2x = n.x - c.x;
    const v2y = n.y - c.y;
    const l1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const l2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (l1 < 0.5 || l2 < 0.5) {
      d += ` L${c.x},${c.y}`;
      continue;
    }

    // Cross product: positive = left turn (convex), negative = right turn (also convex), ~0 = collinear
    const cross = v1x * v2y - v1y * v2x;

    // Skip rounding for nearly-collinear points (angle ~ 180°)
    if (Math.abs(cross) < 0.5) {
      d += ` L${c.x},${c.y}`;
      continue;
    }

    const cr = Math.min(r, l1 / 2, l2 / 2);
    if (cr < 1) {
      d += ` L${c.x},${c.y}`;
      continue;
    }

    const b1x = c.x + (v1x / l1) * cr;
    const b1y = c.y + (v1y / l1) * cr;
    const b2x = c.x + (v2x / l2) * cr;
    const b2y = c.y + (v2y / l2) * cr;

    d += ` L${b1x},${b1y}`;
    d += ` Q${c.x},${c.y} ${b2x},${b2y}`;
  }

  const last = pts[pts.length - 1];
  d += ` L${last.x},${last.y}`;
  return d;
}

/**
 * Shift a border point along the node border by a given offset.
 * This moves the attachment point sideways on the same border edge,
 * keeping it away from corners by a margin.
 */
function shiftAlongBorder(node, point, borderNorm, offset, nx, ny) {
  const margin = 6;
  if (Math.abs(borderNorm.y) > Math.abs(borderNorm.x)) {
    // Top/bottom border — shift horizontally
    const dir = nx >= 0 ? 1 : -1;
    const shift = dir * offset;
    return {
      x: Math.max(node.x + margin, Math.min(node.x + node.w - margin, point.x + shift)),
      y: point.y,
    };
  }
  // Left/right border — shift vertically
  const dir = ny >= 0 ? 1 : -1;
  const shift = dir * offset;
  return {
    x: point.x,
    y: Math.max(node.y + margin, Math.min(node.y + NODE_H - margin, point.y + shift)),
  };
}

export default function PathEdge({ edge, nodesMap, hoveredNode }) {
  const from = nodesMap.get(edge.from);
  const to = nodesMap.get(edge.to);
  if (!from || !to || from === to) return null;

  const fc = getCenter(from);
  const tc = getCenter(to);
  const dx = tc.x - fc.x;
  const dy = tc.y - fc.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  // Perpendicular unit vector (right-hand normal of edge direction)
  const nx = dy / dist;
  const ny = -dx / dist;

  // Border intersection: exit from source, enter at target
  const start = getBorderPoint(from, dx, dy);
  const end = getBorderPoint(to, -dx, -dy);

  let sNorm = getBorderNormal(from, start);
  let eNorm = getBorderNormal(to, end);

  // Handle corner-case normals (0,0) — default to dominant axis
  if (sNorm.x === 0 && sNorm.y === 0)
    sNorm =
      Math.abs(dy) >= Math.abs(dx) ? { x: 0, y: dy > 0 ? 1 : -1 } : { x: dx > 0 ? 1 : -1, y: 0 };
  if (eNorm.x === 0 && eNorm.y === 0)
    eNorm =
      Math.abs(dy) >= Math.abs(dx) ? { x: 0, y: dy > 0 ? 1 : -1 } : { x: dx > 0 ? 1 : -1, y: 0 };

  // For fb/bypass, shift border attachment points along the border
  // so the edge runs parallel to the ff edge without detours
  const offset = edge.type === "fb" ? 28 : edge.type === "bypass" ? 18 : 0;

  let s0 = start;
  let e0 = end;
  if (offset) {
    s0 = shiftAlongBorder(from, start, sNorm, offset, nx, ny);
    e0 = shiftAlongBorder(to, end, eNorm, offset, nx, ny);
  }

  // Short exit/enter stubs along border normals
  const exitLen = Math.max(10, Math.min(dist * 0.15, 24));
  const exit = { x: s0.x + sNorm.x * exitLen, y: s0.y + sNorm.y * exitLen };
  const enter = { x: e0.x + eNorm.x * exitLen, y: e0.y + eNorm.y * exitLen };

  // Simple 3-segment polyline: exit stub → direct connection → enter stub
  const waypoints = [s0, exit, enter, e0];
  const path = roundedPolyline(waypoints, CORNER_R);

  const color = edge.type === "ff" ? "#6e8ecc" : edge.type === "fb" ? "#c47a5a" : "#777";
  const dash = edge.type === "fb" ? "6 4" : edge.type === "bypass" ? "4 4" : "none";
  const connected = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode);
  const dimmed = hoveredNode && !connected;

  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={connected ? 2 : 1.4}
      strokeDasharray={dash}
      markerEnd="url(#arr)"
      opacity={dimmed ? 0.08 : connected ? 1 : 0.55}
      style={{ transition: "opacity 0.2s, stroke-width 0.15s" }}
    />
  );
}
