import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, useEffect, useCallback } from "react";
import { buildNode, useEditorStore } from "../state/useEditorStore";
import {
  containerTypes,
  sanitizeUrl,
  type Breakpoint,
  type FormField,
  type Node,
  type NodeType,
} from "../types/schema";
import GridOverlay from "./viewport/GridOverlay";
import { useViewport } from "./viewport/useViewport";
import { IconButton } from "../../shared/ui";
import {
  resolveBinding,
  type BindingError,
} from "../bindings/resolveBinding";

type DragMeta = {
  id: string;
  blockType?: Node["type"];
  source: "palette" | "canvas";
};

type BindingIssue = BindingError & { nodeId: string; prop: string };
type BindingContext = Record<string, unknown>;

const bpOrder: Breakpoint[] = ["desktop", "tablet", "mobile"];

const mergeStyle = (node: Node, activeBreakpoint: Breakpoint) => {
  const style: Record<string, string | number | undefined> = {};
  const maxIndex = bpOrder.indexOf(activeBreakpoint);
  for (let i = 0; i <= maxIndex; i += 1)
    Object.assign(style, node.styleByBreakpoint[bpOrder[i]]);
  return style;
};

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
  bindingContext,
  onBindingIssues,
}: {
  id: string;
  hoveredDropId: string | null;
  dragMeta: DragMeta | null;
  bindingContext: BindingContext;
  onBindingIssues: (nodeId: string, issues: BindingIssue[]) => void;
}) {
  const node = useEditorStore((s) => s.nodesById[id]);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const mode = useEditorStore((s) => s.mode);
  const updateProps = useEditorStore((s) => s.updateProps);
  const [isEditingText, setIsEditingText] = useState(false);
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
  const nodeBindingContext = bindingContext;

  const resolveNodeBinding = (prop: string, rawValue: unknown) => {
    const result = resolveBinding(rawValue, nodeBindingContext);
    return {
      value: result.value,
      issues: result.errors.map((error) => ({ ...error, nodeId: node.id, prop })),
    };
  };

  const nodeIssues: BindingIssue[] = [];

  /* ── Content per type ── */
  let content: React.ReactNode = null;

  if (node.type === "text") {
    const resolvedText = resolveNodeBinding("text", node.props.text);
    nodeIssues.push(...resolvedText.issues);
    const textValue = typeof resolvedText.value === "string" ? resolvedText.value : String(resolvedText.value ?? "");
    const Tag = node.props.tag as keyof React.JSX.IntrinsicElements;
    content = isEditingText && mode === "edit" ? (
      <Tag
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          setIsEditingText(false);
          updateProps(id, { text: e.currentTarget.textContent || "" });
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          textAlign: node.props.align,
          margin: 0,
          outline: "2px solid #6366f1",
          minWidth: 50,
          fontWeight: node.props.tag === "h1" ? 700 : node.props.tag === "h2" ? 600 : undefined,
        }}
      >
        {node.props.text}
      </Tag>
    ) : (
      <Tag
        onDoubleClick={() => {
          if (mode === "edit") setIsEditingText(true);
        }}
        style={{
          textAlign: node.props.align,
          margin: 0,
          fontWeight: node.props.tag === "h1" ? 700 : node.props.tag === "h2" ? 600 : undefined,
          cursor: mode === "edit" ? "text" : "inherit"
        }}
      >
        {(mode === "preview" ? textValue : node.props.text) || (
          <span style={{ color: "#aaa", fontStyle: "italic" }}>
            Empty text… (Double click to edit)
          </span>
        )}
      </Tag>
    );
  }

  if (node.type === "button") {
    content = (
      <a
        href={sanitizeUrl(node.props.href)}
        target={node.props.target}
        rel="noreferrer"
        style={{
          display: "inline-block",
          padding: "10px 22px",
          borderRadius: 8,
          background: "#6366f1",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {node.props.label || "Button"}
      </a>
    );
  }

  if (node.type === "image") {
    const resolvedSrc = resolveNodeBinding("src", node.props.src);
    const resolvedAlt = resolveNodeBinding("alt", node.props.alt);
    nodeIssues.push(...resolvedSrc.issues, ...resolvedAlt.issues);
    const srcValue = String(resolvedSrc.value ?? "");
    const altValue = String(resolvedAlt.value ?? "");
    if (srcValue) {
      content = (
        <img
          src={sanitizeUrl(srcValue)}
          alt={altValue}
          style={{
            width: "100%",
            display: "block",
            objectFit: node.props.fit,
            borderRadius: 4,
          }}
        />
      );
    } else {
      content = (
        <div
          style={{
            minHeight: 120,
            border: "2px dashed #d1d5db",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
            color: "#9ca3af",
            fontSize: 13,
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 28 }}>⛶</span>
          <span>Drop an image URL in the Inspector</span>
        </div>
      );
    }
  }

  if (node.type === "searchSelect") {
    const sourcePath = resolveNodeBinding("dataPath", node.props.dataPath ?? "");
    nodeIssues.push(...sourcePath.issues);
    const dynamicOptions = Array.isArray(sourcePath.value)
      ? sourcePath.value
      : [];
    const options =
      mode === "preview" && node.props.source === "dataSource"
        ? dynamicOptions.map((option, index) => ({
            id: `bound-${index}`,
            label: String((option as Record<string, unknown>)?.label ?? option),
            value: String((option as Record<string, unknown>)?.value ?? option),
          }))
        : node.props.options;
    content = (
      <label style={{ display: "grid", gap: 5, fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: "#374151" }}>{node.props.label}</span>
        <select
          multiple={node.props.multiple}
          name={node.props.name}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db" }}
        >
          {!node.props.multiple && <option value="">{node.props.placeholder}</option>}
          {options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (node.type === "dataTable") {
    const rowsBinding = resolveNodeBinding("dataPath", node.props.dataPath ?? "");
    nodeIssues.push(...rowsBinding.issues);
    const rows =
      mode === "preview" && node.props.source === "dataSource" && Array.isArray(rowsBinding.value)
        ? rowsBinding.value
        : node.props.rows;

    content = (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {node.props.columns.map((column) => (
                <th
                  key={column.id}
                  style={{ textAlign: column.align, borderBottom: "1px solid #e5e7eb", padding: "8px" }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows as Record<string, unknown>[]).slice(0, node.props.pageSize || 10).map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {node.props.columns.map((column) => (
                  <td
                    key={column.id}
                    style={{ textAlign: column.align, borderBottom: "1px solid #f1f5f9", padding: "8px" }}
                  >
                    {String(row[column.accessor] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (node.type === "spacer") {
    content = (
      <div style={{ height: node.props.size, position: "relative" }}>
        {mode === "edit" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderTop: "1px dashed #d1d5db",
              borderBottom: "1px dashed #d1d5db",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#94a3b8",
                background: "#f8fafc",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {node.props.size}px spacer
            </span>
          </div>
        )}
      </div>
    );
  }

  if (node.type === "divider") {
    content = (
      <hr
        style={{
          border: "none",
          borderTop: `${node.props.thickness}px solid #e2e8f0`,
          margin: "4px 0",
        }}
      />
    );
  }

  if (node.type === "form") {
    content =
      mode === "preview" ? (
        <FormPreview node={node} />
      ) : (
        <div
          style={{
            border: "1px dashed #e2e8f0",
            borderRadius: 8,
            padding: "12px 14px",
            background: "rgba(99,102,241,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>✎</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
              Form
            </span>
            <span
              style={{ fontSize: 11, color: "#6b7280", marginLeft: "auto" }}
            >
              {node.props.fields.length} field
              {node.props.fields.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {node.props.fields.map((f) => (
              <span
                key={f.id}
                style={{
                  padding: "3px 8px",
                  borderRadius: 99,
                  background: "#ede9fe",
                  color: "#7c3aed",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>
      );
  }

  const repeaterBinding =
    node.type === "repeater"
      ? resolveNodeBinding("dataPath", node.props.dataPath)
      : null;
  if (repeaterBinding) nodeIssues.push(...repeaterBinding.issues);
  const repeaterItems = repeaterBinding?.value;

  const issuesSignature = nodeIssues
    .map((issue) => `${issue.prop}|${issue.expression}|${issue.message}`)
    .join(";");

  useEffect(() => {
    onBindingIssues(node.id, nodeIssues);
  }, [node.id, onBindingIssues, issuesSignature]);

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

        {content}

        {node.type === "repeater" && mode === "preview" && Array.isArray(repeaterItems) ? (
          (repeaterItems as unknown[]).map((item, index) => (
            <div key={`${node.id}-item-${index}`} style={{ marginBottom: 8 }}>
              {node.children.map((childId) => (
                <RenderNode
                  key={`${childId}-${index}`}
                  id={childId}
                  hoveredDropId={hoveredDropId}
                  dragMeta={dragMeta}
                  bindingContext={{ ...nodeBindingContext, [node.props.itemContextName]: item, index }}
                  onBindingIssues={onBindingIssues}
                />
              ))}
            </div>
          ))
        ) : (
          <SortableContext items={node.children} strategy={rectSortingStrategy}>
            {node.children.map((childId) => (
              <RenderNode
                key={childId}
                id={childId}
                hoveredDropId={hoveredDropId}
                dragMeta={dragMeta}
                bindingContext={nodeBindingContext}
                onBindingIssues={onBindingIssues}
              />
            ))}
          </SortableContext>
        )}

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
  const submissions = useEditorStore((s) => s.submissions);
  const [bindingIssues, setBindingIssues] = useState<Record<string, BindingIssue[]>>({});

  const previewBindingContext = useMemo<BindingContext>(
    () => ({
      data: {
        products: [
          { name: "Keyboard", price: 99.99 },
          { name: "Mouse", price: 39.5 },
        ],
        submissions,
      },
    }),
    [submissions],
  );

  const onBindingIssues = useCallback((nodeId: string, issues: BindingIssue[]) => {
    setBindingIssues((prev) => {
      const current = prev[nodeId] ?? [];
      const sameLength = current.length === issues.length;
      const sameContent =
        sameLength &&
        current.every((item, index) =>
          item.prop === issues[index]?.prop &&
          item.expression === issues[index]?.expression &&
          item.message === issues[index]?.message,
        );

      if (sameContent) return prev;

      const next = { ...prev };
      if (issues.length) next[nodeId] = issues;
      else delete next[nodeId];
      return next;
    });
  }, []);

  useEffect(() => {
    const allIssues = Object.values(bindingIssues).flat();
    if (!allIssues.length) return;
    console.warn("[bindings] Non-blocking binding issues detected", allIssues);
  }, [bindingIssues]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          activeEl?.tagName === "INPUT" ||
          activeEl?.tagName === "TEXTAREA" ||
          activeEl?.isContentEditable
        )
          return;

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

  const findParentId = (childId: string) =>
    Object.values(nodesById).find((n) => n.children.includes(childId))?.id;

  const isDescendant = (ancestorId: string, targetId: string): boolean => {
    const n = nodesById[ancestorId];
    if (!n) return false;
    if (n.children.includes(targetId)) return true;
    return n.children.some((cId) => isDescendant(cId, targetId));
  };

  const isAllowedParent = (childType: NodeType, parentType: NodeType) => {
    const allowed = builderConfig.constraints.allowedParents[childType];
    return !allowed || allowed.includes(parentType);
  };

  const hasChildCapacity = (parentId: string) => {
    const parent = nodesById[parentId];
    if (!parent) return false;
    const max = builderConfig.constraints.maxChildren[parent.type];
    return typeof max !== "number" || parent.children.length < max;
  };

  const resolveDropParent = (overId: string | null) => {
    if (!overId) return rootId;
    if (overId.startsWith("drop-")) return overId.replace("drop-", "");
    const overNode = nodesById[overId];
    if (!overNode) return rootId;
    if (containerTypes.includes(overNode.type)) return overNode.id;
    return findParentId(overNode.id) ?? rootId;
  };

  const resolveDropIndex = (overId: string | null, parentId: string) => {
    if (!overId || overId.startsWith("drop-")) return undefined;
    const parentNode = nodesById[parentId];
    if (!parentNode) return undefined;
    const idx = parentNode.children.findIndex((c) => c === overId);
    return idx >= 0 ? idx : undefined;
  };

  const onDragStart = (event: DragStartEvent) => {
    setDragMeta({
      id: String(event.active.id),
      blockType: event.active.data.current?.blockType as
        | Node["type"]
        | undefined,
      source:
        (event.active.data.current?.source as DragMeta["source"]) ?? "canvas",
    });
    setHoveredDropId(null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!dragMeta) return;
    const parentId = resolveDropParent(overId);
    const parentNode = nodesById[parentId];
    if (!parentNode) return;

    if (dragMeta.source === "palette" && dragMeta.blockType) {
      const dropIndex = resolveDropIndex(overId, parentId);
      if (
        isAllowedParent(dragMeta.blockType, parentNode.type) &&
        hasChildCapacity(parentId)
      ) {
        addNode(parentId, buildNode(dragMeta.blockType), dropIndex);
      }
    }

    if (dragMeta.source === "canvas") {
      if (dragMeta.id === parentId || isDescendant(dragMeta.id, parentId)) {
        setDragMeta(null);
        return;
      }
      const currentParentId = findParentId(dragMeta.id);
      const dropIndex = resolveDropIndex(overId, parentId);
      if (currentParentId === parentId && dropIndex !== undefined) {
        const currentIndex = parentNode.children.findIndex(
          (c) => c === dragMeta.id,
        );
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
      <RenderNode
        id={root.id}
        hoveredDropId={hoveredDropId}
        dragMeta={dragMeta}
        bindingContext={previewBindingContext}
        onBindingIssues={onBindingIssues}
      />
    </div>
  );

  if (mode === "preview") {
    return (
      <div
        style={{
          padding: 24,
          overflow: "auto",
          height: "100%",
          background: "#f1f5f9",
        }}
      >
        {canvasFrame}
        {Object.values(bindingIssues).flat().length > 0 && (
          <div
            style={{
              marginTop: 12,
              background: "#fff7ed",
              border: "1px solid #fdba74",
              color: "#9a3412",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
            }}
          >
            <strong>Binding debug</strong>
            {Object.values(bindingIssues)
              .flat()
              .map((issue, index) => (
                <div key={`${issue.nodeId}-${issue.prop}-${index}`}>
                  node {issue.nodeId} · {issue.prop}: {issue.message}
                </div>
              ))}
          </div>
        )}
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
        {/* Zoom toolbar */}
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

        {/* Canvas scroll area */}
        <div style={{ flex: 1, overflow: "auto", padding: 40 }}>
          {canvasFrame}
        </div>
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
