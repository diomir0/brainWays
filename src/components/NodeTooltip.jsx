import { useRef, useEffect, useState } from "react";

export default function NodeTooltip({ node, position }) {
  const ref = useRef(null);
  const [side, setSide] = useState("right");
  const col = node.color || "#888";

  const gap = 14;
  const maxWidth = 320;

  // Decide whether to place to the right or left of the anchor
  useEffect(() => {
    const rightRoom = window.innerWidth - position.x;
    setSide(rightRoom < maxWidth + gap + 10 ? "left" : "right");
  }, [position]);

  const left = side === "right" ? position.x + gap : position.x - gap;
  const transformX = side === "right" ? "0" : "-100%";

  return (
    <div
      ref={ref}
      role="tooltip"
      style={{
        position: "fixed",
        left,
        top: position.y,
        transform: `translateX(${transformX}) translateY(-50%)`,
        zIndex: 50,
        maxWidth: 320,
        minWidth: 200,
        background: "rgba(12,12,18,0.96)",
        border: `1px solid ${col}55`,
        borderRadius: 10,
        padding: "12px 14px 14px",
        backdropFilter: "blur(14px)",
        boxShadow: `0 6px 28px rgba(0,0,0,0.55), 0 0 0 1px ${col}18`,
        animation: "fadeIn 0.12s ease",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12.5,
            fontWeight: 600,
            color: col,
          }}
        >
          {node.label}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9.5,
            color: "#555",
          }}
        >
          {node.sub}
        </span>
      </div>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: "#aaa",
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {node.detail}
      </p>
    </div>
  );
}
