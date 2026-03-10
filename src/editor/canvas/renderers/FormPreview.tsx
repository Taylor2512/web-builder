import { useState } from "react";
import { useEditorStore } from "../../state/useEditorStore";
import type { Node } from "../../types/schema";
import { validateField } from "../../forms/validation";

export const FormPreview = ({ node }: { node: Extract<Node, { type: "form" }> }) => {
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
            {field.required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
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
