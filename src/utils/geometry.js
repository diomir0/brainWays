export const NODE_H = 56;

export function getCenter(node) {
  return { x: node.x + node.w / 2, y: node.y + NODE_H / 2 };
}

/**
 * Find the point on the border of a node's rectangle that a ray from
 * the center in direction (dx, dy) exits through.
 */
export function getBorderPoint(node, dx, dy) {
  const cx = node.x + node.w / 2;
  const cy = node.y + NODE_H / 2;
  const hw = node.w / 2;
  const hh = NODE_H / 2;

  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const scaleX = hw / (Math.abs(dx) || 1e-10);
  const scaleY = hh / (Math.abs(dy) || 1e-10);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

/**
 * Outward-facing unit normal at a border point — indicates which edge
 * of the rectangle the point lies on and which direction points away.
 */
export function getBorderNormal(node, borderPoint) {
  const eps = 0.5;
  if (Math.abs(borderPoint.y - (node.y + NODE_H)) < eps) return { x: 0, y: 1 };
  if (Math.abs(borderPoint.y - node.y) < eps) return { x: 0, y: -1 };
  if (Math.abs(borderPoint.x - (node.x + node.w)) < eps) return { x: 1, y: 0 };
  if (Math.abs(borderPoint.x - node.x) < eps) return { x: -1, y: 0 };
  return { x: 0, y: 0 };
}
