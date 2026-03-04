import React from "react";

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 800, marginBottom: 10 }}>{children}</div>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 12,
        boxShadow: "var(--shadow)",
      }}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        padding: "10px 10px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "rgba(0,0,0,.25)",
        color: "var(--text)",
        outline: "none",
      }}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      style={{
        padding: "10px 10px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "rgba(0,0,0,.25)",
        color: "var(--text)",
        outline: "none",
        minHeight: 90,
        resize: "vertical",
      }}
    />
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.12)",
        background: "var(--primary)",
        color: "white",
        cursor: "pointer",
        fontWeight: 700,
      }}
    />
  );
}

export function GhostButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "transparent",
        color: "var(--text)",
        cursor: "pointer",
        fontWeight: 600,
      }}
    />
  );
}
