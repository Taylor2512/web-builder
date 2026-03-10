import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState, useEffect } from "react";
import { buildNode, useEditorStore } from "../state/useEditorStore";
import { type Node } from "../types/schema";
import GridOverlay from "./viewport/GridOverlay";
import { useViewport } from "./viewport/useViewport";
import { IconButton } from "../../shared/ui";
import { RenderNode, type DragMeta } from "./renderers/RenderNode";
import {
  findParentId,
  hasChildCapacity,
  isAllowedParent,
  isDescendant,
  resolveDropIndex,
  resolveDropParent,
} from "./interaction/dnd";

export default function Canvas() {
  const rootId = useEditorStore((s) => s.rootId);
  const mode = useEditorStore((s) => s.mode);
  const nodesById = useEditorStore((s) => s.nodesById);
  const moveNode = useEditorStore((s) => s.moveNode);
  const addNode = useEditorStore((s) => s.addNode);
  const builderConfig = useEditorStore((s) => s.builderConfig);
  const [dragMeta, setDragMeta] = useState<DragMeta | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Backspace" || event.key === "Delete") {
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          activeEl?.tagName === "INPUT" ||
          activeEl?.tagName === "TEXTAREA" ||
          activeEl?.isContentEditable
        ) {
          return;
        }

        const state = useEditorStore.getState();
        if (state.mode === "edit" && state.selectedNodeId) {
          const node = state.nodesById[state.selectedNodeId];
          if (node && node.type !== "page") {
            state.removeNode(state.selectedNodeId);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);
  const { viewport, zoomIn, zoomOut, resetViewport } = useViewport();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const root = nodesById[rootId];

  const onDragStart = (event: DragStartEvent) => {
    setDragMeta({
      id: String(event.active.id),
      blockType: event.active.data.current?.blockType as Node["type"] | undefined,
      source: (event.active.data.current?.source as DragMeta["source"]) ?? "canvas",
    });
    setHoveredDropId(null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!dragMeta) return;

    const parentId = resolveDropParent(overId, nodesById, rootId);
    const parentNode = nodesById[parentId];
    if (!parentNode) return;

    if (dragMeta.source === "palette" && dragMeta.blockType) {
      const dropIndex = resolveDropIndex(overId, parentId, nodesById);
      if (
        isAllowedParent(
          dragMeta.blockType,
          parentNode.type,
          builderConfig.constraints.allowedParents,
        ) &&
        hasChildCapacity(
          parentId,
          nodesById,
          builderConfig.constraints.maxChildren,
        )
      ) {
        addNode(parentId, buildNode(dragMeta.blockType), dropIndex);
      }
    }

    if (dragMeta.source === "canvas") {
      if (
        dragMeta.id === parentId ||
        isDescendant(nodesById, dragMeta.id, parentId)
      ) {
        setDragMeta(null);
        return;
      }

      const currentParentId = findParentId(nodesById, dragMeta.id);
      const dropIndex = resolveDropIndex(overId, parentId, nodesById);
      if (currentParentId === parentId && dropIndex !== undefined) {
        const currentIndex = parentNode.children.findIndex((c) => c === dragMeta.id);
        moveNode(
          dragMeta.id,
          parentId,
          currentIndex < dropIndex ? dropIndex + 1 : dropIndex,
        );
      } else {
        moveNode(dragMeta.id, parentId, dropIndex);
      }
    }

    setDragMeta(null);
    setHoveredDropId(null);
  };

  const onDragOver = (event: DragOverEvent) => {
    setHoveredDropId(event.over ? String(event.over.id) : null);
  };

  const onDragCancel = () => {
    setDragMeta(null);
    setHoveredDropId(null);
  };

  const dragLabel = useMemo(() => {
    if (!dragMeta) return "";
    if (dragMeta.source === "palette") return `+ ${dragMeta.blockType}`;
    return nodesById[dragMeta.id]?.type ?? "block";
  }, [dragMeta, nodesById]);

  if (!root) return null;

  const canvasFrame = (
    <div
      style={{
        width: builderConfig.breakpoints.desktop.width,
        maxWidth: "100%",
        minHeight: 640,
        border:
          mode === "edit"
            ? "1px solid rgba(99,102,241,0.2)"
            : "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 24,
        background: "#ffffff",
        color: "#111827",
        position: "relative",
        transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
        transformOrigin: "top center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      <GridOverlay
        size={builderConfig.grid.size}
        visible={builderConfig.grid.show && mode === "edit"}
        zoom={viewport.zoom}
      />
      <RenderNode id={root.id} hoveredDropId={hoveredDropId} dragMeta={dragMeta} />
    </div>
  );

  if (mode === "preview") {
    return (
      <div style={{ padding: 24, overflow: "auto", height: "100%", background: "#f1f5f9" }}>
        {canvasFrame}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "#0e1520",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            background: "rgba(0,0,0,0.3)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <IconButton onClick={zoomOut} title="Zoom out">
            −
          </IconButton>
          <span
            style={{
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              color: "#64748b",
              minWidth: 48,
              textAlign: "center",
            }}
          >
            {Math.round(viewport.zoom * 100)}%
          </span>
          <IconButton onClick={zoomIn} title="Zoom in">
            +
          </IconButton>
          <IconButton
            onClick={resetViewport}
            title="Fit view"
            style={{ marginLeft: 4, fontSize: 11 }}
          >
            ↺
          </IconButton>
          <div style={{ flex: 1 }} />
          {dragMeta && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 99,
                background: "var(--primary-dim)",
                color: "var(--primary)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <span>✦</span> Dragging: {dragLabel}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 40 }}>{canvasFrame}</div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragMeta ? (
          <div
            style={{
              padding: "6px 14px",
              background: "var(--primary)",
              color: "#fff",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
              transform: "rotate(2deg)",
              whiteSpace: "nowrap",
            }}
          >
            {dragLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
