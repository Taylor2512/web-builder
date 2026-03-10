import { useEditorStore } from "../../state/useEditorStore";
import type { Node } from "../../types/schema";
import { TYPE_COLOR } from "../styles/nodeColors";

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "rgba(255,255,255,0.15)",
        border: "none",
        color: "#fff",
        cursor: "pointer",
        padding: "2px 5px",
        fontSize: 10,
        lineHeight: 1,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}

export function NodeToolbar({ node, onDelete }: { node: Node; onDelete: () => void }) {
  const removeNode = useEditorStore((s) => s.removeNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const moveNodeSibling = useEditorStore((s) => s.moveNodeSibling);
  const accent = TYPE_COLOR[node.type] ?? "#6366f1";

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
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
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
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>#{node.id.slice(-4)}</span>
      </div>

      {node.type !== "page" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: "rgba(0,0,0,0.75)",
            borderRadius: "6px 6px 0 0",
            padding: "3px 5px",
            backdropFilter: "blur(6px)",
          }}
        >
          <ToolBtn onClick={() => moveNodeSibling(node.id, "up")} title="Mover arriba">
            ↑
          </ToolBtn>
          <ToolBtn onClick={() => moveNodeSibling(node.id, "down")} title="Mover abajo">
            ↓
          </ToolBtn>
          <ToolBtn onClick={() => duplicateNode(node.id)} title="Duplicar">
            ⧉
          </ToolBtn>
          <ToolBtn
            onClick={() => {
              onDelete();
              removeNode(node.id);
            }}
            title="Eliminar bloque"
          >
            <span style={{ color: "#fca5a5" }}>✕</span>
          </ToolBtn>
        </div>
      )}
    </div>
  );
}
