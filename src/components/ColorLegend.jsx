import { useMemo } from "react";
import { ALL_MODALITIES } from "../data/pathways";

// Labels for colors not covered by ALL_MODALITIES
const EXTRA_LABELS = {
  "#888": "Auxiliary",
  "#666": "Structural",
};

const COLOR_LABEL_MAP = (() => {
  const map = {};
  for (const m of ALL_MODALITIES) map[m.color] = m.label;
  Object.assign(map, EXTRA_LABELS);
  return map;
})();

export default function ColorLegend({ nodes }) {
  const items = useMemo(() => {
    const seen = new Map();
    for (const n of nodes) {
      if (!seen.has(n.color)) {
        seen.set(n.color, COLOR_LABEL_MAP[n.color] || n.color);
      }
    }
    return Array.from(seen, ([color, label]) => ({ color, label }));
  }, [nodes]);

  if (items.length === 0) return null;

  return (
    <div
      role="list"
      aria-label="Node color legend"
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "10px 12px",
        background: "rgba(9,9,13,0.88)",
        border: "1px solid #1a1a24",
        borderRadius: 8,
        backdropFilter: "blur(12px)",
        pointerEvents: "none",
      }}
    >
      {items.map(({ color, label }) => (
        <div
          key={color}
          role="listitem"
          style={{ display: "flex", alignItems: "center", gap: 7 }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: color,
              opacity: 0.85,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              color: "#777",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
