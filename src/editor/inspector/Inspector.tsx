import { useEditorStore } from "../state/useEditorStore";
import { Card, Field, PanelTitle, TextArea, TextInput } from "../../shared/ui";
import type { Node } from "../types/schema";

export default function Inspector() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const node = useEditorStore((s) =>
    selectedId ? s.nodesById[selectedId] : null,
  );
  const props = node?.p as Node["p"] | undefined;
  const style = node?.s as Node["s"] | undefined;
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const updateNodeStyle = useEditorStore((s) => s.updateNodeStyle);

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <PanelTitle>Inspector</PanelTitle>

      {!node ? (
        <Card>
          <div style={{ color: "var(--muted)" }}>
            Selecciona un elemento en el canvas.
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {node.type} · {node.id}
            </div>
          </Card>

          {props && "kind" in props && (props as { kind?: string }).kind === "text" && (
            <Card>
              <Field label="Contenido">
                <TextArea
                  value={props?.content ?? ""}
                  onChange={(e) => updateNodeProps(node.id, { content: e.target.value })}
                />
              </Field>
            </Card>
          )}

          {props && "kind" in props && (props as { kind?: string }).kind === "button" && (
            <Card>
              <div style={{ display: "grid", gap: 10 }}>
                <Field label="Label">
                  <TextInput
                    value={props?.label ?? ""}
                    onChange={(e) => updateNodeProps(node.id, { label: e.target.value })}
                  />
                </Field>
                <Field label="Href">
                  <TextInput
                    value={props?.href ?? ""}
                    onChange={(e) => updateNodeProps(node.id, { href: e.target.value })}
                  />
                </Field>
              </div>
            </Card>
          )}

          <Card>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Style</div>
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Padding">
                <TextInput
                  type="number"
                  value={String(style?.padding ?? 0)}
                  onChange={(e) => updateNodeStyle(node.id, { padding: Number(e.target.value) })}
                />
              </Field>

              <Field label="Font Size">
                <TextInput
                  type="number"
                  value={String(style?.fontSize ?? 16)}
                  onChange={(e) => updateNodeStyle(node.id, { fontSize: Number(e.target.value) })}
                />
              </Field>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
