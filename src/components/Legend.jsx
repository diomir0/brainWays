const LEGEND_ITEMS = [
  { color: "#6e8ecc", dash: false, label: "Feedforward" },
  { color: "#c47a5a", dash: true, label: "Feedback" },
  { color: "#777", dash: true, label: "Bypass / reflex" },
];

export default function Legend() {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        padding: "5px 0 3px",
        flexWrap: "wrap",
      }}
      role="list"
      aria-label="Edge type legend"
    >
      {LEGEND_ITEMS.map((l) => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }} role="listitem">
          <svg width={30} height={10} aria-hidden="true">
            <defs>
              <marker
                id={`leg-${l.label}`}
                viewBox="0 0 10 10"
                refX={8}
                refY={5}
                markerWidth={5}
                markerHeight={5}
                orient="auto-start-reverse"
              >
                <path d="M2 1L8 5L2 9" fill="none" stroke={l.color} strokeWidth="1.5" />
              </marker>
            </defs>
            <line
              x1={2}
              y1={5}
              x2={26}
              y2={5}
              stroke={l.color}
              strokeWidth={1.4}
              strokeDasharray={l.dash ? "5 3" : "none"}
              markerEnd={`url(#leg-${l.label})`}
            />
          </svg>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: "#666" }}>
            {l.label}
          </span>
        </div>
      ))}
    </div>
  );
}
