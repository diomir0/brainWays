import { NODE_H } from "../utils/geometry";

export default function PathNode({ node, hovered, onHoverNode }) {
  const isHovered = hovered === node.id;
  const col = node.color || "#888";

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${node.label}: ${node.sub}`}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => onHoverNode(node.id)}
      onMouseLeave={() => onHoverNode(null)}
      onFocus={() => onHoverNode(node.id)}
      onBlur={() => onHoverNode(null)}
    >
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={NODE_H}
        rx={7}
        fill={col}
        fillOpacity={isHovered ? 0.22 : 0.08}
        stroke={col}
        strokeOpacity={isHovered ? 1 : 0.38}
        strokeWidth={isHovered ? 1.8 : 0.7}
        style={{ transition: "all 0.15s" }}
      />
      <text
        x={node.x + node.w / 2}
        y={node.y + 20}
        textAnchor="middle"
        dominantBaseline="central"
        fill={col}
        fontSize={11.5}
        fontWeight={600}
        fontFamily="'DM Mono', monospace"
      >
        {node.label}
      </text>
      <text
        x={node.x + node.w / 2}
        y={node.y + 39}
        textAnchor="middle"
        dominantBaseline="central"
        fill={col}
        fontSize={9.5}
        fontWeight={400}
        opacity={0.6}
        fontFamily="'DM Mono', monospace"
      >
        {node.sub}
      </text>
    </g>
  );
}
