import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import PathEdge from "./PathEdge";
import PathNode from "./PathNode";
import NodeTooltip from "./NodeTooltip";
import ColorLegend from "./ColorLegend";
import { NODE_H, getCenter } from "../utils/geometry";

export default function PathwayDiagram({ pathway }) {
  const { nodes, edges } = pathway;
  const svgRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const nodesMap = useMemo(() => {
    const map = new Map();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  const hoveredNodeData = hoveredNode ? nodesMap.get(hoveredNode) : null;

  // Compute tight viewBox around all nodes
  const vb = useMemo(() => {
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + n.w));
    const maxY = Math.max(...nodes.map((n) => n.y + NODE_H));
    const pad = 24;
    return {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    };
  }, [nodes]);

  // Zoom transform — slight zoom centred on hovered node
  const zoom = 1.25;
  const nodeCenter = hoveredNodeData ? getCenter(hoveredNodeData) : null;

  // Compute tooltip position — at the right edge center of the node
  const computePos = useCallback((node) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const rightX = node.x + node.w;
    const centerY = node.y + NODE_H / 2;
    return {
      x: ctm.a * rightX + ctm.c * centerY + ctm.e,
      y: ctm.b * rightX + ctm.d * centerY + ctm.f,
    };
  }, []);

  const handleHoverNode = useCallback(
    (id) => {
      if (id === null) {
        setHoveredNode(null);
        setTooltipPos(null);
        return;
      }
      const node = nodesMap.get(id);
      setHoveredNode(id);
      setTooltipPos(node ? computePos(node) : null);
    },
    [nodesMap, computePos],
  );

  // Recompute tooltip on window resize while a node is hovered
  useEffect(() => {
    if (!hoveredNodeData) return;
    const onResize = () => setTooltipPos(computePos(hoveredNodeData));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hoveredNodeData, computePos]);

  return (
    <>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        role="img"
        aria-label={`Diagram of the ${pathway.title}`}
      >
        <defs>
          <marker
            id="arr"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path
              d="M2 1L8 5L2 9"
              fill="none"
              stroke="context-stroke"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        <g
          style={{
            transform: hoveredNodeData ? `scale(${zoom})` : "scale(1)",
            transformOrigin: hoveredNodeData ? `${nodeCenter.x}px ${nodeCenter.y}px` : "0px 0px",
            transition: "transform 0.35s ease-out",
          }}
        >
          {edges.map((e, i) => (
            <PathEdge key={i} edge={e} nodesMap={nodesMap} hoveredNode={hoveredNode} />
          ))}
          {nodes.map((n) => (
            <PathNode key={n.id} node={n} hovered={hoveredNode} onHoverNode={handleHoverNode} />
          ))}
        </g>
      </svg>

      {/* Color legend — positioned on the left side */}
      <ColorLegend nodes={nodes} />

      {hoveredNodeData && tooltipPos && (
        <NodeTooltip node={hoveredNodeData} position={tooltipPos} />
      )}
    </>
  );
}
