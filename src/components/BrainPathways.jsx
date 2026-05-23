import { useState, useCallback } from "react";
import { CATEGORIES, ALL_MODALITIES, PATHWAYS } from "../data/pathways";
import { validatePathwayData } from "../utils/validateData";
import PathwayDiagram from "./PathwayDiagram";
import Legend from "./Legend";

// Run data validation once at module load
validatePathwayData();

export default function BrainPathways() {
  const [modality, setModality] = useState("visual");

  const pathway = PATHWAYS[modality];
  const activeMod = ALL_MODALITIES.find((m) => m.id === modality);

  const handleSelect = useCallback((id) => {
    setModality(id);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#09090d",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "#eee",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #181820", flexShrink: 0 }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#3a3a4a",
            letterSpacing: "0.14em",
            marginBottom: 4,
          }}
        >
          NEURAL PATHWAYS EXPLORER
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: activeMod?.color || "#fff",
            fontFamily: "'DM Mono', monospace",
            transition: "color 0.2s",
          }}
        >
          {pathway.title}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "#3a3a4a",
            fontFamily: "'DM Mono', monospace",
            marginTop: 2,
          }}
        >
          {pathway.subtitle}
        </div>
      </div>

      {/* Modality nav — always visible inline pills, grouped by category */}
      <div style={{ borderBottom: "1px solid #181820", flexShrink: 0, padding: "8px 14px 8px" }}>
        <nav
          aria-label="Neural pathway categories"
          style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}
        >
          {CATEGORIES.map((cat, ci) => (
            <div
              key={cat.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              {ci > 0 && (
                <span
                  style={{
                    color: "#1e1e28",
                    marginRight: 2,
                    userSelect: "none",
                    fontSize: 14,
                  }}
                >
                  │
                </span>
              )}
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: "#333340",
                  marginRight: 2,
                  letterSpacing: "0.06em",
                }}
              >
                {cat.label}
              </span>
              {cat.modalities.map((m) => {
                const isAct = modality === m.id;
                return (
                  <button
                    key={m.id}
                    className="mod-pill"
                    onClick={() => handleSelect(m.id)}
                    aria-pressed={isAct}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 8px",
                      borderRadius: 5,
                      background: isAct ? m.color + "18" : "transparent",
                      border: `1px solid ${isAct ? m.color + "55" : "#1c1c28"}`,
                      color: isAct ? m.color : "#666",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      fontWeight: isAct ? 600 : 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{m.icon}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Legend */}
      <div style={{ padding: "2px 18px 0", borderBottom: "1px solid #111116", flexShrink: 0 }}>
        <Legend />
      </div>

      {/* Diagram — key resets internal hover state on modality switch */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
        }}
      >
        <PathwayDiagram key={modality} pathway={pathway} />
      </div>
    </div>
  );
}
