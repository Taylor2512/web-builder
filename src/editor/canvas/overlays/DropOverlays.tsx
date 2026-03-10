export function InsertHintOverlay() {
  return (
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
  );
}

export function MoveHintOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 2,
        border: "2px dashed rgba(99,102,241,0.6)",
        borderRadius: 8,
        pointerEvents: "none",
      }}
    />
  );
}

export function DropReleaseHint() {
  return (
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
  );
}
