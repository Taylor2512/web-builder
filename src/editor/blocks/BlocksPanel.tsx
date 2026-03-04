import { useEditorStore } from "../state/useEditorStore";
import { Card, PanelTitle, GhostButton } from "../../shared/ui";
import { createNode } from "../types/schema";

const BLOCKS = [
  { type: "section" as const, label: "Section" },
  { type: "container" as const, label: "Container" },
  { type: "text" as const, label: "Text" },
  { type: "button" as const, label: "Button" },
];

export default function BlocksPanel() {
  const rootId = useEditorStore((s) => s.rootId);
  const addNode = useEditorStore((s) => s.addNode);

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <PanelTitle>Blocks</PanelTitle>

      <Card>
        <div style={{ display: "grid", gap: 10 }}>
          {BLOCKS.map((b) => (
            <GhostButton
              key={b.type}
              onClick={() => addNode(rootId, createNode({ type: b.type }))}
            >
              + {b.label}
            </GhostButton>
          ))}
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            MVP: click para agregar. Luego dnd-kit para drag & drop real.
          </div>
        </div>
      </Card>
    </div>
  );
}
