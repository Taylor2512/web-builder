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
import {
  containerTypes,
  type Breakpoint,
  type Node,
  type NodeType,
} from "../types/schema";
import GridOverlay from "./viewport/GridOverlay";
import { useViewport } from "./viewport/useViewport";
import { IconButton } from "../../shared/ui";
import { rendererRegistry } from "./renderers/rendererRegistry";

type DragMeta = {
  id: string;
  blockType?: Node["type"];
  source: "palette" | "canvas";
};

const bpOrder: Breakpoint[] = ["desktop", "tablet", "mobile"];

const mergeStyle = (node: Node, activeBreakpoint: Breakpoint) => {
  const style: Record<string, string | number | undefined> = {};
  const maxIndex = bpOrder.indexOf(activeBreakpoint);
  for (let i = 0; i <= maxIndex; i += 1)
    Object.assign(style, node.styleByBreakpoint[bpOrder[i]]);
  return style;
};


const scopeCustomCss = (nodeId: string, css: string) => {
  if (!css.trim()) return ''
  return css
    .split('}')
    .map((chunk) => {
      const [selector, body] = chunk.split('{')
      if (!selector || !body) return ''
      const scopedSelector = selector
        .split(',')
        .map((item) => {
          const normalized = item.trim()
          if (!normalized) return ''
          return normalized.includes('&')
            ? normalized.replaceAll('&', `[data-node-id="${nodeId}"]`)
            : `[data-node-id="${nodeId}"] ${normalized}`
        })
        .filter(Boolean)
        .join(', ')
      if (!scopedSelector) return ''
      return `${scopedSelector} {${body}}`
    })
    .filter(Boolean)
    .join('\n')
}

const validateField = (
  field: FormField,
  raw: FormDataEntryValue | null,
): string | null => {
  const value = typeof raw === "string" ? raw : "";
  if (field.required && !value) return `${field.label} is required`;
  if (field.type === "email" && value && !/^\S+@\S+\.\S+$/.test(value))
    return `${field.label} must be an email`;
  if (field.minLength && value.length < field.minLength)
    return `${field.label} min length ${field.minLength}`;
  if (field.maxLength && value.length > field.maxLength)
    return `${field.label} max length ${field.maxLength}`;
  if (field.pattern && value && !new RegExp(field.pattern).test(value))
    return `${field.label} invalid format`;
  return null;
};

/* ── Beautiful form preview ── */
const FormPreview = ({ node }: { node: Extract<Node, { type: "form" }> }) => {
  const submitForm = useEditorStore((s) => s.submitForm);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: node.props.layout === "grid" ? "1fr 1fr" : "1fr",
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const formData = new FormData(event.currentTarget);
        const payload: Record<string, unknown> = {};
        for (const field of node.props.fields) {
          const raw = formData.get(field.name);
          const validation = validateField(field, raw);
          if (validation) {
            setError(validation);
            return;
          }
          payload[field.name] =
            field.type === "checkbox" || field.type === "switch" ? !!raw : raw;
        }
        setOutput(JSON.stringify(payload, null, 2));
        submitForm(node.id, payload);
      }}
    >
      {node.props.fields.map((field) => (
        <label key={field.id} style={{ display: "grid", gap: 5, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>
            {field.label}
            {field.required && (
              <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
            )}
          </span>
          <input
            type={field.type === "switch" ? "checkbox" : field.type}
            name={field.name}
            required={field.required}
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1.5px solid #d1d5db",
              outline: "none",
              fontSize: 13,
              color: "#111827",
              background: "#f9fafb",
            }}
          />
        </label>
      ))}
      <button
        type="submit"
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: "#6366f1",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {node.props.submitText}
      </button>
      {error && (
        <div
          style={{
            padding: "8px 12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#ef4444",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      {output && (
        <pre
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#1e293b",
            padding: 10,
            borderRadius: 8,
            fontSize: 11,
            overflow: "auto",
          }}
        >
          {output}
        </pre>
      )}
    </form>
  );
};

/* ── Node type color coding ── */
const TYPE_COLOR: Record<string, string> = {
  page: "#6366f1",
  section: "#8b5cf6",
  container: "#06b6d4",
  grid: "#10b981",
  text: "#f59e0b",
  image: "#ec4899",
  button: "#3b82f6",
  form: "#f97316",
  spacer: "#94a3b8",
  divider: "#94a3b8",
  dateInput: "#f59e0b",
  searchSelect: "#f59e0b",
  dataTable: "#f59e0b",
  searchBar: "#f59e0b",
  repeater: "#f59e0b",
};

/* ── Edit-mode node toolbar ── */
function NodeToolbar({ node, onDelete }: { node: Node; onDelete: () => void }) {
  const removeNode = useEditorStore((s) => s.removeNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const moveNodeSibling = useEditorStore((s) => s.moveNodeSibling);
  const accent = TYPE_COLOR[node.type] ?? "#6366f1";

  const ToolBtn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
        cursor: "pointer", padding: "2px 5px", fontSize: 10, lineHeight: 1,
        borderRadius: 3, display: "flex", alignItems: "center",
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        position: "absolute",
        top: -32,
        left: 0,
        display: "flex",
        alignItems: "center",
        gap: 3,
        zIndex: 100,
        pointerEvents: "all",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Type badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: accent,
          borderRadius: "6px 6px 0 0",
          padding: "3px 8px",
        }}
      >
        <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, letterSpacing: "0.05em" }}>
          {node.type}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>
          #{node.id.slice(-4)}
        </span>
      </div>

      {/* Action buttons */}
      {node.type !== "page" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          background: "rgba(0,0,0,0.75)", borderRadius: "6px 6px 0 0",
          padding: "3px 5px", backdropFilter: "blur(6px)",
        }}>
          <ToolBtn onClick={() => moveNodeSibling(node.id, "up")} title="Mover arriba">↑</ToolBtn>
          <ToolBtn onClick={() => moveNodeSibling(node.id, "down")} title="Mover abajo">↓</ToolBtn>
          <ToolBtn onClick={() => duplicateNode(node.id)} title="Duplicar">⧉</ToolBtn>
          <ToolBtn
            onClick={() => { onDelete(); removeNode(node.id); }}
            title="Eliminar bloque"
          >
            <span style={{ color: "#fca5a5" }}>✕</span>
          </ToolBtn>
        </div>
      )}
    </div>
  );
}
/* ── On-Canvas Resizer ── */
function NodeResizer({ id, nodeType }: { id: string; nodeType: string }) {
  const updateStyle = useEditorStore((s) => s.updateStyle);
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    direction: "right" | "bottom" | "bottom-right",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialEl = e.currentTarget.parentElement;
    if (!initialEl) return;
    const initialWidth = initialEl.offsetWidth;
    const initialHeight = initialEl.offsetHeight;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const updates: Record<string, string> = {};
      if (direction === "right" || direction === "bottom-right")
        updates.width = `${Math.max(20, initialWidth + deltaX)}px`;
      if (direction === "bottom" || direction === "bottom-right")
        updates.height = `${Math.max(20, initialHeight + deltaY)}px`;
      updateStyle(id, updates);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleColor = TYPE_COLOR[nodeType] ?? "#6366f1";
  const handleRawStyle: React.CSSProperties = {
    position: "absolute",
    background: "#fff",
    border: `2px solid ${handleColor}`,
    zIndex: 101,
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  };

  return (
    <>
      <div
        onPointerDown={(e) => handlePointerDown(e, "right")}
        style={{
          ...handleRawStyle,
          top: "50%",
          right: -6,
          marginTop: -6,
          width: 12,
          height: 12,
          borderRadius: "50%",
          cursor: "ew-resize",
        }}
      />
      <div
        onPointerDown={(e) => handlePointerDown(e, "bottom")}
        style={{
          ...handleRawStyle,
          bottom: -6,
          left: "50%",
          marginLeft: -6,
          width: 12,
          height: 12,
          borderRadius: "50%",
          cursor: "ns-resize",
        }}
      />
      <div
        onPointerDown={(e) => handlePointerDown(e, "bottom-right")}
        style={{
          ...handleRawStyle,
          bottom: -6,
          right: -6,
          width: 12,
          height: 12,
          borderRadius: "50%",
          cursor: "nwse-resize",
        }}
      />
    </>
  );
}

/* ── Single node renderer ── */
function RenderNode({
  id,
  hoveredDropId,
  dragMeta,
}: {
  id: string;
  hoveredDropId: string | null;
  dragMeta: DragMeta | null;
}) {
  const node = useEditorStore((s) => s.nodesById[id]);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const mode = useEditorStore((s) => s.mode);
  const updateProps = useEditorStore((s) => s.updateProps);
  const submitForm = useEditorStore((s) => s.submitForm);
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint);
  const {
    setNodeRef: setSortableRef,
    transform,
    transition,
    attributes,
    listeners,
  } = useSortable({ id, data: { source: "canvas" } });
  const canDropInside = node ? containerTypes.includes(node.type) : false;
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `drop-${id}`,
    disabled: !canDropInside || mode === "preview",
  });

  if (!node) return null;

  const computedStyle = mergeStyle(node, activeBreakpoint);
  const isSelected = selectedNodeId === id;
  const dropZoneId = `drop-${node.id}`;
  const isDropTarget = hoveredDropId === dropZoneId;
  const showInsertHint =
    isDropTarget && mode === "edit" && dragMeta?.source === "palette";
  const showMoveHint =
    hoveredDropId === node.id &&
    mode === "edit" &&
    dragMeta?.source === "canvas";
  const isContainer = containerTypes.includes(node.type);

  /* ── Content per type ── */
  const renderChildren = (keyPrefix = "") => (
    <SortableContext items={node.children} strategy={rectSortingStrategy}>
      {node.children.map((childId) => (
        <RenderNode
          key={`${keyPrefix}${childId}`}
          id={childId}
          hoveredDropId={hoveredDropId}
          dragMeta={dragMeta}
        />
      ))}
    </SortableContext>
  );

  const renderNodeByType = rendererRegistry[node.type];
  const rendered = renderNodeByType({
    node: node as never,
    mode,
    renderChildren,
    updateProps,
    submitForm,
  });
  const content = rendered.content;

  /* ── Border / selection style ── */
  const editBorder =
    mode === "edit"
      ? isSelected
        ? `2px solid ${TYPE_COLOR[node.type] ?? "#6366f1"}`
        : "1px dashed rgba(0,0,0,0.1)"
      : "none";

  const nodeStyle: React.CSSProperties = {
    ...computedStyle,
    position: "relative",
    padding:
      (computedStyle.padding as number | undefined) ?? (isContainer ? 16 : 8),
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
    minHeight:
      isContainer && !node.children.length && mode === "edit" ? 60 : undefined,
  };

  return (
    <div
      ref={setSortableRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div
        ref={setDroppableRef}
        data-node-id={node.id}
        onClick={(event) => {
          event.stopPropagation();
          if (mode === "edit") selectNode(id);
        }}
        {...(mode === "edit" ? attributes : {})}
        {...(mode === "edit" ? listeners : {})}
        style={nodeStyle}
      >
        {/* Selected toolbar */}
        {isSelected && mode === "edit" && (
          <NodeToolbar node={node} onDelete={() => selectNode(null)} />
        )}
        {isSelected && mode === "edit" && node.type !== "page" && (
          <NodeResizer id={node.id} nodeType={node.type} />
        )}

        {/* Container label (not selected) */}
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

        {/* Empty container hint */}
        {isContainer &&
          !node.children.length &&
          !content &&
          mode === "edit" &&
          !showInsertHint && (
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

        {node.customCss && <style>{scopeCustomCss(node.id, node.customCss)}</style>}
        {content}

        {!rendered.handlesChildren && renderChildren()}

        {/* Drop insert overlay */}
        {showInsertHint && (
          <div
            style={{
              position: "absolute",
              inset: 4,
              border: "2px dashed #6366f1",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              background: "rgba(99,102,241,0.07)",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "#6366f1",
                fontWeight: 700,
                background: "#ede9fe",
                padding: "4px 10px",
                borderRadius: 99,
              }}
            >
              Drop to insert here
            </span>
          </div>
        )}

        {showMoveHint && (
          <div
            style={{
              position: "absolute",
              inset: 2,
              border: "2px dashed rgba(99,102,241,0.6)",
              borderRadius: 8,
              pointerEvents: "none",
            }}
          />
        )}

        {isOver && mode === "edit" && (
          <div
            style={{
              position: "absolute",
              bottom: 4,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 10,
              color: "#6366f1",
              background: "#ede9fe",
              padding: "2px 8px",
              borderRadius: 99,
              pointerEvents: "none",
            }}
          >
            Release to drop
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Canvas ── */
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
