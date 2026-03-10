import { sanitizeUrl, type Node, type NodeType } from "../../types/schema";
import { FormPreview } from "./FormPreview";

type NodeRendererContext = {
  mode: "edit" | "preview";
  isEditingText: boolean;
  setIsEditingText: (isEditing: boolean) => void;
  updateProps: (id: string, patch: Record<string, unknown>) => void;
};

type NodeRenderer = (node: Node, context: NodeRendererContext) => React.ReactNode;

const textWeight = (tag: string) => {
  if (tag === "h1") return 700;
  if (tag === "h2") return 600;
  return undefined;
};

export const nodeRenderers: Partial<Record<NodeType, NodeRenderer>> = {
  text: (node, { mode, isEditingText, setIsEditingText, updateProps }) => {
    const textNode = node as Extract<Node, { type: "text" }>;
    const Tag = textNode.props.tag as keyof React.JSX.IntrinsicElements;

    if (isEditingText && mode === "edit") {
      return (
        <Tag
          contentEditable
          suppressContentEditableWarning
          onBlur={(event) => {
            setIsEditingText(false);
            updateProps(textNode.id, { text: event.currentTarget.textContent || "" });
          }}
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            textAlign: textNode.props.align,
            margin: 0,
            outline: "2px solid #6366f1",
            minWidth: 50,
            fontWeight: textWeight(textNode.props.tag),
          }}
        >
          {textNode.props.text}
        </Tag>
      );
    }

    return (
      <Tag
        onDoubleClick={() => {
          if (mode === "edit") setIsEditingText(true);
        }}
        style={{
          textAlign: textNode.props.align,
          margin: 0,
          fontWeight: textWeight(textNode.props.tag),
          cursor: mode === "edit" ? "text" : "inherit",
        }}
      >
        {textNode.props.text || (
          <span style={{ color: "#aaa", fontStyle: "italic" }}>
            Empty text… (Double click to edit)
          </span>
        )}
      </Tag>
    );
  },
  button: (node) => {
    const buttonNode = node as Extract<Node, { type: "button" }>;
    return (
      <a
        href={sanitizeUrl(buttonNode.props.href)}
        target={buttonNode.props.target}
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
        {buttonNode.props.label || "Button"}
      </a>
    );
  },
  image: (node) => {
    const imageNode = node as Extract<Node, { type: "image" }>;
    if (imageNode.props.src) {
      return (
        <img
          src={sanitizeUrl(imageNode.props.src)}
          alt={imageNode.props.alt}
          style={{
            width: "100%",
            display: "block",
            objectFit: imageNode.props.fit,
            borderRadius: 4,
          }}
        />
      );
    }

    return (
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
  },
  spacer: (node, { mode }) => {
    const spacerNode = node as Extract<Node, { type: "spacer" }>;
    return (
      <div style={{ height: spacerNode.props.size, position: "relative" }}>
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
              {spacerNode.props.size}px spacer
            </span>
          </div>
        )}
      </div>
    );
  },
  divider: (node) => {
    const dividerNode = node as Extract<Node, { type: "divider" }>;
    return (
      <hr
        style={{
          border: "none",
          borderTop: `${dividerNode.props.thickness}px solid #e2e8f0`,
          margin: "4px 0",
        }}
      />
    );
  },
  form: (node, { mode }) => {
    const formNode = node as Extract<Node, { type: "form" }>;
    return mode === "preview" ? (
      <FormPreview node={formNode} />
    ) : (
      <div
        style={{
          border: "1px dashed #e2e8f0",
          borderRadius: 8,
          padding: "12px 14px",
          background: "rgba(99,102,241,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>✎</span>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>Form</span>
          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: "auto" }}>
            {formNode.props.fields.length} field{formNode.props.fields.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {formNode.props.fields.map((field) => (
            <span
              key={field.id}
              style={{
                padding: "3px 8px",
                borderRadius: 99,
                background: "#ede9fe",
                color: "#7c3aed",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {field.label}
            </span>
          ))}
        </div>
      </div>
    );
  },
};

export const renderNodeContent = (node: Node, context: NodeRendererContext): React.ReactNode => {
  const renderer = nodeRenderers[node.type];
  if (!renderer) return null;
  return renderer(node, context);
};
