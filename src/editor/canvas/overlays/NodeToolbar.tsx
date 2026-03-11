import { useState } from "react";
import { useEditorStore } from "../../state/useEditorStore";
import type { Node } from "../../types/schema";
import { TYPE_COLOR } from "../styles/nodeColors";

/* ── SVG Icons ── */
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

const IconChevronUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── Toolbar button ── */
function ToolBtn({
  onClick,
  title,
  children,
  danger = false,
  active = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  active?: boolean;
}) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: active
          ? "rgba(17,109,255,0.25)"
          : danger && hov
            ? "rgba(220,38,38,0.25)"
            : hov
              ? "rgba(255,255,255,0.18)"
              : "rgba(255,255,255,0.08)",
        border: "none",
        color: danger ? (hov ? "#fca5a5" : "rgba(255,255,255,0.7)") : active ? "#93c5fd" : "#fff",
        cursor: "pointer",
        padding: "5px 7px",
        fontSize: 11,
        lineHeight: 1,
        borderRadius: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 120ms, color 120ms",
      }}
    >
      {children}
    </button>
  );
}

/* ── Divider ── */
function ToolDivider() {
  return (
    <div
      style={{
        width: 1,
        height: 16,
        background: "rgba(255,255,255,0.15)",
        flexShrink: 0,
        margin: "0 2px",
      }}
    />
  );
}

export function NodeToolbar({ node, onDelete }: { node: Node; onDelete: () => void }) {
  const removeNode = useEditorStore((s) => s.removeNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const moveNodeSibling = useEditorStore((s) => s.moveNodeSibling);
  const toggleNodeVisibility = useEditorStore((s) => s.toggleNodeVisibility);
  const accent = TYPE_COLOR[node.type] ?? "#6366f1";

  return (
    <div
      style={{
        position: "absolute",
        top: -40,
        left: 0,
        display: "flex",
        alignItems: "stretch",
        gap: 3,
        zIndex: 1000,
        pointerEvents: "all",
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
      }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {/* Type badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: accent,
          borderRadius: "7px 7px 0 0",
          padding: "0 10px",
          height: 32,
        }}
      >
        <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, letterSpacing: "0.04em", textTransform: "capitalize" }}>
          {node.type}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.03em",
          }}
        >
          #{node.id.slice(-4)}
        </span>
      </div>

      {/* Action buttons */}
      {node.type !== "page" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: "rgba(15,20,35,0.88)",
            borderRadius: "7px 7px 0 0",
            padding: "0 5px",
            height: 32,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
          }}
        >
          {/* Visibility toggle */}
          <ToolBtn
            onClick={() => toggleNodeVisibility(node.id)}
            title={node.isHidden ? "Show element" : "Hide element"}
            active={node.isHidden}
          >
            {node.isHidden ? <IconEyeOff /> : <IconEye />}
          </ToolBtn>

          <ToolDivider />

          {/* Move up/down */}
          <ToolBtn onClick={() => moveNodeSibling(node.id, "up")} title="Move up">
            <IconChevronUp />
          </ToolBtn>
          <ToolBtn onClick={() => moveNodeSibling(node.id, "down")} title="Move down">
            <IconChevronDown />
          </ToolBtn>

          <ToolDivider />

          {/* Duplicate */}
          <ToolBtn onClick={() => duplicateNode(node.id)} title="Duplicate element">
            <IconCopy />
          </ToolBtn>

          {/* Delete */}
          <ToolBtn
            danger
            onClick={() => {
              onDelete();
              removeNode(node.id);
            }}
            title="Delete element"
          >
            <IconTrash />
          </ToolBtn>
        </div>
      )}
    </div>
  );
}
