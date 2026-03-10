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
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);
  const [isEditingText, setIsEditingText] = useState(false);

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

  const computedStyle = mergeResponsiveStyle(node, activeBreakpoint);
  const isSelected = selectedNodeId === id;
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

  const editBorder =
    mode === "edit"
      ? isSelected
        ? `2px solid ${TYPE_COLOR[node.type] ?? "#6366f1"}`
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
    transition: "box-shadow 120ms, border-color 120ms",
    boxShadow:
      isSelected && mode === "edit"
        ? `0 0 0 3px ${TYPE_COLOR[node.type] ?? "#6366f1"}40`
        : isDropTarget && mode === "edit"
          ? "0 0 0 2px #6366f1, inset 0 0 0 2px rgba(99,102,241,0.1)"
          : (computedStyle.boxShadow as string | undefined),
    background:
      isDropTarget && mode === "edit"
        ? "rgba(99,102,241,0.04)"
        : ((computedStyle.background as string | undefined) ??
          (isContainer ? "rgba(0,0,0,0.015)" : undefined)),
    minHeight: isContainer && !node.children.length && mode === "edit" ? 60 : undefined,
    display: node.isHidden ? "none" : (computedStyle.display as string | undefined),
  };

  return (
    <div ref={setSortableRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div
        ref={setDroppableRef}
        onClick={(event) => {
          event.stopPropagation();
          if (mode === "edit") selectNode(id);
        }}
        {...(mode === "edit" ? attributes : {})}
        {...(mode === "edit" ? listeners : {})}
        style={nodeStyle}
      >
        {isSelected && mode === "edit" && <NodeToolbar node={node} onDelete={() => selectNode(null)} />}
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
      </div>
    </div>
  );
}
