import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useEditorStore } from "../../state/useEditorStore";
import { containerTypes, type Node } from "../../types/schema";
import { TYPE_COLOR } from "../styles/nodeColors";
import { mergeResponsiveStyle } from "./mergeResponsiveStyle";
import { getRenderableChildIds } from "./nodeVisibility";
import { renderNodeContent } from "./nodeRenderers";
import { NodeResizer } from "../overlays/NodeResizer";
import { NodeToolbar } from "../overlays/NodeToolbar";
import { DropReleaseHint, InsertHintOverlay, MoveHintOverlay } from "../overlays/DropOverlays";

/* Eye-slash SVG for the hidden overlay badge */
const EyeSlashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export type DragMeta = {
  id: string;
  blockType?: Node["type"];
  source: "palette" | "canvas";
};


export function RenderNode({
  id,
  hoveredDropId,
  dragMeta,
}: {
  id: string;
  hoveredDropId: string | null;
  dragMeta: DragMeta | null;
}) {
  const node = useEditorStore((state) => state.nodesById[id]);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);
  const mode = useEditorStore((state) => state.mode);
  const updateProps = useEditorStore((state) => state.updateProps);
  const toggleNodeVisibility = useEditorStore((state) => state.toggleNodeVisibility);
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { setNodeRef: setSortableRef, transform, transition, attributes, listeners } = useSortable({
    id,
    data: { source: "canvas" },
  });

  const canDropInside = node ? containerTypes.includes(node.type) : false;
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `drop-${id}`,
    disabled: !canDropInside || mode === "preview",
  });

  if (!node) return null;

  // In preview mode, truly hide hidden nodes
  if (mode === "preview" && node.isHidden) return null;

  const computedStyle = mergeResponsiveStyle(node, activeBreakpoint);
  const isSelected = selectedNodeId === id;
  const isHidden = Boolean(node.isHidden);
  const dropZoneId = `drop-${node.id}`;
  const isDropTarget = hoveredDropId === dropZoneId;
  const showInsertHint = isDropTarget && mode === "edit" && dragMeta?.source === "palette";
  const showMoveHint = hoveredDropId === node.id && mode === "edit" && dragMeta?.source === "canvas";
  const isContainer = containerTypes.includes(node.type);
  const childIds = getRenderableChildIds(node);

  const content = renderNodeContent(node, {
    mode,
    isEditingText,
    setIsEditingText,
    updateProps: (nodeId, patch) => updateProps(nodeId, patch),
  });

  // Hidden nodes get a dashed border instead of normal border
  const editBorder =
    mode === "edit"
      ? isSelected
        ? `2px solid ${TYPE_COLOR[node.type] ?? "#6366f1"}`
        : isHidden
          ? "2px dashed rgba(245,158,11,0.55)"
          : isHovered
            ? `1px solid ${TYPE_COLOR[node.type] ?? "#6366f1"}80`
            : "1px dashed rgba(0,0,0,0.1)"
      : "none";

  const nodeStyle: React.CSSProperties = {
    ...computedStyle,
    position: "relative",
    padding: (computedStyle.padding as number | undefined) ?? (isContainer ? 16 : 8),
    border: editBorder,
    borderRadius: (computedStyle.borderRadius as number | undefined) ?? 6,
    marginBottom: 6,
    outline: "none",
    // Smooth transition for visibility changes + hover
    transition: "box-shadow 150ms ease, border-color 150ms ease, opacity 200ms ease, background 150ms ease",
    boxShadow:
      isSelected && mode === "edit"
        ? `0 0 0 3px ${TYPE_COLOR[node.type] ?? "#6366f1"}40`
        : isDropTarget && mode === "edit"
          ? "0 0 0 2px #6366f1, inset 0 0 0 2px rgba(99,102,241,0.1)"
          : isHovered && mode === "edit" && !isHidden
            ? `0 0 0 2px ${TYPE_COLOR[node.type] ?? "#6366f1"}30`
            : (computedStyle.boxShadow as string | undefined),
    background:
      isDropTarget && mode === "edit"
        ? "rgba(99,102,241,0.04)"
        : ((computedStyle.background as string | undefined) ??
          (isContainer ? "rgba(0,0,0,0.015)" : undefined)),
    minHeight: isContainer && !node.children.length && mode === "edit" ? 60 : undefined,
    // Hidden in edit mode: show translucent, not display:none
    opacity: isHidden && mode === "edit" ? 0.45 : 1,
  };

  return (
    <div ref={setSortableRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div
        ref={setDroppableRef}
        onClick={(event) => {
          event.stopPropagation();
          if (mode === "edit") selectNode(id);
        }}
        onMouseEnter={() => { if (mode === "edit") setIsHovered(true); }}
        onMouseLeave={() => setIsHovered(false)}
        {...(mode === "edit" ? attributes : {})}
        {...(mode === "edit" ? listeners : {})}
        style={nodeStyle}
      >
        {/* Show toolbar when selected OR hovered (for non-page nodes) */}
        {(isSelected || isHovered) && mode === "edit" && <NodeToolbar node={node} onDelete={() => selectNode(null)} />}
        {isSelected && mode === "edit" && node.type !== "page" && (
          <NodeResizer id={node.id} nodeType={node.type} />
        )}

        {isContainer && !isSelected && mode === "edit" && (
          <div
            style={{
              position: "absolute",
              top: 3,
              left: 5,
              fontSize: 9,
              fontWeight: 700,
              color: TYPE_COLOR[node.type] ?? "#6366f1",
              opacity: 0.5,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            {node.type}
          </div>
        )}

        {isContainer && !node.children.length && !content && mode === "edit" && !showInsertHint && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 60,
              color: "#94a3b8",
              fontSize: 12,
              pointerEvents: "none",
            }}
          >
            <span style={{ marginRight: 6 }}>+</span> Drag a block here
          </div>
        )}

        {content}

        <SortableContext items={childIds} strategy={rectSortingStrategy}>
          {childIds.map((childId) => (
              <RenderNode key={childId} id={childId} hoveredDropId={hoveredDropId} dragMeta={dragMeta} />
            ))}
        </SortableContext>

        {showInsertHint && <InsertHintOverlay />}
        {showMoveHint && <MoveHintOverlay />}
        {isOver && mode === "edit" && <DropReleaseHint />}

        {/* Hidden overlay — shown in edit mode so user sees the element is hidden */}
        {isHidden && mode === "edit" && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              selectNode(id);
            }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background: "repeating-linear-gradient(45deg, rgba(245,158,11,0.06) 0px, rgba(245,158,11,0.06) 6px, transparent 6px, transparent 12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              pointerEvents: "all",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(245,158,11,0.9)",
                color: "#fff",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                pointerEvents: "all",
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeVisibility(id);
              }}
              title="Click to show element"
            >
              <EyeSlashIcon />
              <span>Hidden</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
