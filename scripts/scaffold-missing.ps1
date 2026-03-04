# scripts/scaffold-missing.ps1
# Crea carpetas/archivos faltantes para el proyecto "web-builder" (Vite + React + TS)
# No sobrescribe archivos existentes.

$ErrorActionPreference = "Stop"

# Root del proyecto: ...\web-builder
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Ensure-Dir([string]$path) {
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Force -Path $path | Out-Null
    Write-Host "DIR  + $path"
  }
}

function Ensure-File([string]$path, [string]$content) {
  if (-not (Test-Path $path)) {
    $dir = Split-Path $path -Parent
    Ensure-Dir $dir
    $content | Out-File -FilePath $path -Encoding UTF8 -Force
    Write-Host "FILE + $path"
  } else {
    Write-Host "SKIP   $path"
  }
}

# -----------------------------
# 1) Carpetas base
# -----------------------------
$dirs = @(
  "src\editor\blocks",
  "src\editor\canvas",
  "src\editor\inspector",
  "src\editor\state",
  "src\editor\types",
  "src\editor\utils",
  "src\shared",
  "src\styles"
)

foreach ($d in $dirs) {
  Ensure-Dir (Join-Path $ProjectRoot $d)
}

# -----------------------------
# 2) Contenidos mínimos
# -----------------------------

$schemaTs = @"
export type NodeType =
  | "page"
  | "section"
  | "container"
  | "text"
  | "button";

export type StyleMap = Record<string, string | number | undefined>;

export type NodeProps =
  | { kind: "page"; title?: string }
  | { kind: "section"; name?: string }
  | { kind: "container"; maxWidth?: number }
  | { kind: "text"; content: string; as?: "p" | "h1" | "h2" | "h3" }
  | { kind: "button"; label: string; href?: string };

export type EditorNode = {
  id: string;
  type: NodeType;
  props: NodeProps;
  style?: StyleMap;
  children: string[];
};

export type EditorTree = {
  rootId: string;
  nodesById: Record<string, EditorNode>;
};

export type BlockDefinition = {
  type: NodeType;
  label: string;
  create: () => Omit<EditorNode, "id">;
};

export function createId(prefix = "n") {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}
"@

$themesTs = @"
export type ThemeTokens = {
  bg: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
};

export const defaultTheme: ThemeTokens = {
  bg: "var(--bg)",
  surface: "var(--surface)",
  text: "var(--text)",
  mutedText: "var(--muted-text)",
  border: "var(--border)",
  primary: "var(--primary)",
};
"@

$tokensCss = @"
:root{
  --bg: #0b0f14;
  --surface: #111827;
  --text: #e5e7eb;
  --muted-text: #9ca3af;
  --border: rgba(255,255,255,.10);
  --primary: #7c3aed;
}
"@

$storeTs = @"
import { create } from "zustand";
import { createId, EditorNode, EditorTree, NodeType } from "../types/schema";

type EditorState = {
  tree: EditorTree;
  selectedId: string | null;
  addNode: (parentId: string, nodeType: NodeType) => void;
  selectNode: (id: string | null) => void;
  updateNodeProps: (id: string, patch: Partial<EditorNode["props"]>) => void;
  updateNodeStyle: (id: string, patch: Record<string, any>) => void;
};

function createNodeByType(type: NodeType): Omit<EditorNode, "id"> {
  switch (type) {
    case "page":
      return { type, props: { kind: "page", title: "Home" }, style: {}, children: ["section_1"] };
    case "section":
      return { type, props: { kind: "section", name: "Section" }, style: { padding: 24 }, children: [] };
    case "container":
      return { type, props: { kind: "container", maxWidth: 960 }, style: { padding: 16 }, children: [] };
    case "text":
      return { type, props: { kind: "text", content: "Texto", as: "p" }, style: { fontSize: 16 }, children: [] };
    case "button":
      return { type, props: { kind: "button", label: "Botón", href: "#" }, style: {}, children: [] };
    default:
      return { type: "text", props: { kind: "text", content: "Texto", as: "p" }, style: {}, children: [] };
  }
}

const initialTree: EditorTree = (() => {
  const rootId = "page_1";
  const sectionId = "section_1";
  const nodesById: Record<string, EditorNode> = {
    [rootId]: { id: rootId, ...createNodeByType("page") } as EditorNode,
    [sectionId]: { id: sectionId, ...createNodeByType("section") } as EditorNode,
  };
  nodesById[rootId].children = [sectionId];
  nodesById[sectionId].children = [];
  return { rootId, nodesById };
})();

export const useEditorStore = create<EditorState>((set, get) => ({
  tree: initialTree,
  selectedId: null,

  addNode: (parentId, nodeType) => {
    const id = createId(nodeType);
    const newNode: EditorNode = { id, ...createNodeByType(nodeType) } as EditorNode;

    set((state) => {
      const parent = state.tree.nodesById[parentId];
      if (!parent) return state;

      return {
        ...state,
        tree: {
          ...state.tree,
          nodesById: {
            ...state.tree.nodesById,
            [id]: newNode,
            [parentId]: { ...parent, children: [...parent.children, id] },
          },
        },
        selectedId: id,
      };
    });
  },

  selectNode: (id) => set({ selectedId: id }),

  updateNodeProps: (id, patch) => {
    set((state) => {
      const node = state.tree.nodesById[id];
      if (!node) return state;
      return {
        ...state,
        tree: {
          ...state.tree,
          nodesById: {
            ...state.tree.nodesById,
            [id]: { ...node, props: { ...node.props, ...patch } as any },
          },
        },
      };
    });
  },

  updateNodeStyle: (id, patch) => {
    set((state) => {
      const node = state.tree.nodesById[id];
      if (!node) return state;
      return {
        ...state,
        tree: {
          ...state.tree,
          nodesById: {
            ...state.tree.nodesById,
            [id]: { ...node, style: { ...(node.style ?? {}), ...patch } },
          },
        },
      };
    });
  },
}));
"@

$blocksPanelTsx = @"
import { useEditorStore } from "../state/useEditorStore";

const BLOCKS = [
  { type: "section" as const, label: "Section" },
  { type: "container" as const, label: "Container" },
  { type: "text" as const, label: "Text" },
  { type: "button" as const, label: "Button" },
];

export default function BlocksPanel() {
  const rootId = useEditorStore((s) => s.tree.rootId);
  const addNode = useEditorStore((s) => s.addNode);

  return (
    <aside style={{ padding: 12, borderRight: "1px solid var(--border)" }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Blocks</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {BLOCKS.map((b) => (
          <button
            key={b.type}
            onClick={() => addNode(rootId, b.type)}
            style={{
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            + {b.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12, color: "var(--muted-text)", fontSize: 12 }}>
        MVP: por ahora “click para agregar”. Luego lo cambiamos a drag & drop con dnd-kit.
      </div>
    </aside>
  );
}
"@

$canvasTsx = @"
import { useMemo } from "react";
import { useEditorStore } from "../state/useEditorStore";
import type { EditorNode } from "../types/schema";

function NodeView({ node }: { node: EditorNode }) {
  const selectNode = useEditorStore((s) => s.selectNode);
  const selectedId = useEditorStore((s) => s.selectedId);

  const isSelected = selectedId === node.id;

  const common: React.CSSProperties = {
    outline: isSelected ? "2px solid var(--primary)" : "1px dashed rgba(255,255,255,.10)",
    outlineOffset: 2,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    cursor: "pointer",
    ...(node.style as any),
  };

  switch (node.type) {
    case "page":
      return (
        <div onClick={(e) => (e.stopPropagation(), selectNode(node.id))} style={{ ...common, background: "transparent" }}>
          {node.children.map((id) => (
            <RenderNode key={id} id={id} />
          ))}
        </div>
      );

    case "section":
      return (
        <section onClick={(e) => (e.stopPropagation(), selectNode(node.id))} style={{ ...common, background: "rgba(255,255,255,.03)" }}>
          <div style={{ fontSize: 12, color: "var(--muted-text)", marginBottom: 8 }}>SECTION</div>
          {node.children.map((id) => (
            <RenderNode key={id} id={id} />
          ))}
        </section>
      );

    case "container":
      return (
        <div onClick={(e) => (e.stopPropagation(), selectNode(node.id))} style={{ ...common, background: "rgba(0,0,0,.15)" }}>
          <div style={{ fontSize: 12, color: "var(--muted-text)", marginBottom: 8 }}>CONTAINER</div>
          {node.children.map((id) => (
            <RenderNode key={id} id={id} />
          ))}
        </div>
      );

    case "text":
      return (
        <div onClick={(e) => (e.stopPropagation(), selectNode(node.id))} style={common}>
          {"kind" in node.props && node.props.kind === "text" ? node.props.content : "Text"}
        </div>
      );

    case "button":
      return (
        <button
          onClick={(e) => (e.stopPropagation(), selectNode(node.id))}
          style={{
            ...common,
            border: "1px solid var(--border)",
            background: "var(--primary)",
            color: "white",
          }}
        >
          {"kind" in node.props && node.props.kind === "button" ? node.props.label : "Button"}
        </button>
      );

    default:
      return (
        <div onClick={(e) => (e.stopPropagation(), selectNode(node.id))} style={common}>
          Node
        </div>
      );
  }
}

function RenderNode({ id }: { id: string }) {
  const node = useEditorStore((s) => s.tree.nodesById[id]);
  if (!node) return null;
  return <NodeView node={node} />;
}

export default function Canvas() {
  const rootId = useEditorStore((s) => s.tree.rootId);
  const root = useEditorStore((s) => s.tree.nodesById[rootId]);

  const empty = useMemo(() => !root || root.children.length === 0, [root]);

  return (
    <main style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Canvas</div>

      <div
        style={{
          minHeight: 420,
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "rgba(255,255,255,.02)",
          padding: 16,
        }}
      >
        {empty ? (
          <div style={{ color: "var(--muted-text)" }}>
            Canvas vacío. Agrega un bloque desde el panel izquierdo.
          </div>
        ) : (
          <RenderNode id={rootId} />
        )}
      </div>
    </main>
  );
}
"@

$inspectorTsx = @"
import { useEditorStore } from "../state/useEditorStore";

export default function Inspector() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const node = useEditorStore((s) => (selectedId ? s.tree.nodesById[selectedId] : null));
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const updateNodeStyle = useEditorStore((s) => s.updateNodeStyle);

  if (!node) {
    return (
      <aside style={{ padding: 12, borderLeft: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Inspector</div>
        <div style={{ color: "var(--muted-text)" }}>Selecciona un elemento en el canvas.</div>
      </aside>
    );
  }

  const kind = (node.props as any).kind;

  return (
    <aside style={{ padding: 12, borderLeft: "1px solid var(--border)" }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Inspector</div>

      <div style={{ fontSize: 12, color: "var(--muted-text)", marginBottom: 10 }}>
        {node.type} · {node.id}
      </div>

      {kind === "text" && (
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 12 }}>Contenido</label>
          <textarea
            value={(node.props as any).content ?? ""}
            onChange={(e) => updateNodeProps(node.id, { content: e.target.value } as any)}
            style={{ padding: 8, borderRadius: 10 }}
          />
        </div>
      )}

      {kind === "button" && (
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 12 }}>Label</label>
          <input
            value={(node.props as any).label ?? ""}
            onChange={(e) => updateNodeProps(node.id, { label: e.target.value } as any)}
            style={{ padding: 8, borderRadius: 10 }}
          />
          <label style={{ fontSize: 12 }}>Href</label>
          <input
            value={(node.props as any).href ?? ""}
            onChange={(e) => updateNodeProps(node.id, { href: e.target.value } as any)}
            style={{ padding: 8, borderRadius: 10 }}
          />
        </div>
      )}

      <hr style={{ margin: "14px 0", borderColor: "var(--border)" }} />

      <div style={{ fontWeight: 600, marginBottom: 8 }}>Style</div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: 12 }}>Padding</label>
        <input
          type="number"
          value={Number((node.style as any)?.padding ?? 0)}
          onChange={(e) => updateNodeStyle(node.id, { padding: Number(e.target.value) })}
          style={{ padding: 8, borderRadius: 10 }}
        />
        <label style={{ fontSize: 12 }}>Font Size</label>
        <input
          type="number"
          value={Number((node.style as any)?.fontSize ?? 16)}
          onChange={(e) => updateNodeStyle(node.id, { fontSize: Number(e.target.value) })}
          style={{ padding: 8, borderRadius: 10 }}
        />
      </div>
    </aside>
  );
}
"@

$formBuilderTsx = @"
import BlocksPanel from "./BlocksPanel";
import Canvas from "../canvas/Canvas";
import Inspector from "../inspector/Inspector";

export default function FormBuilder() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 320px",
        height: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <BlocksPanel />
      <Canvas />
      <Inspector />
    </div>
  );
}
"@

$sharedButtonTsx = @"
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function Button({ variant = "primary", style, ...rest }: Props) {
  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    cursor: "pointer",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "var(--primary)", color: "#fff" },
    ghost: { background: "transparent", color: "var(--text)" },
  };

  return <button {...rest} style={{ ...base, ...variants[variant], ...style }} />;
}
"@

$appTsx = @"
import "./App.css";
import FormBuilder from "./editor/blocks/FormBuilder";

export default function App() {
  return <FormBuilder />;
}
"@

$appCss = @"
/* App.css (mínimo) */
"@

$indexCss = @"
@import "./styles/tokens.css";

:root{
  color-scheme: dark;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

body{
  margin: 0;
  background: var(--bg);
  color: var(--text);
}
"@

$mainTsx = @"
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"@

# -----------------------------
# 3) Crear archivos faltantes
# -----------------------------
$files = @(
  @{ path = "src\editor\types\schema.ts"; content = $schemaTs },
  @{ path = "src\editor\utils\themes.ts"; content = $themesTs },
  @{ path = "src\styles\tokens.css"; content = $tokensCss },
  @{ path = "src\editor\state\useEditorStore.ts"; content = $storeTs },
  @{ path = "src\editor\blocks\BlocksPanel.tsx"; content = $blocksPanelTsx },
  @{ path = "src\editor\canvas\Canvas.tsx"; content = $canvasTsx },
  @{ path = "src\editor\inspector\Inspector.tsx"; content = $inspectorTsx },
  @{ path = "src\editor\blocks\FormBuilder.tsx"; content = $formBuilderTsx },
  @{ path = "src\shared\Button.tsx"; content = $sharedButtonTsx },
  @{ path = "src\App.tsx"; content = $appTsx },
  @{ path = "src\App.css"; content = $appCss },
  @{ path = "src\index.css"; content = $indexCss },
  @{ path = "src\main.tsx"; content = $mainTsx }
)

foreach ($f in $files) {
  Ensure-File (Join-Path $ProjectRoot $f.path) $f.content
}

Write-Host ""
Write-Host "Listo. Si faltaban archivos, ya fueron creados (sin sobrescribir los existentes)."
Write-Host "Ahora ejecuta:"
Write-Host "  npm install"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Nota: este scaffold deja un MVP funcional por clicks. Luego metemos drag & drop con dnd-kit."
"@

# Fin
"