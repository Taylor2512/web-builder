import { useEditorStore } from "../../state/useEditorStore";
import { TYPE_COLOR } from "../styles/nodeColors";

export function NodeResizer({ id, nodeType }: { id: string; nodeType: string }) {
  const updateStyle = useEditorStore((s) => s.updateStyle);
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    direction: "right" | "bottom" | "bottom-right",
  ) => {
    event.stopPropagation();
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const initialEl = event.currentTarget.parentElement;
    if (!initialEl) return;

    const initialWidth = initialEl.offsetWidth;
    const initialHeight = initialEl.offsetHeight;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const updates: Record<string, string> = {};

      if (direction === "right" || direction === "bottom-right") {
        updates.width = `${Math.max(20, initialWidth + deltaX)}px`;
      }
      if (direction === "bottom" || direction === "bottom-right") {
        updates.height = `${Math.max(20, initialHeight + deltaY)}px`;
      }

      updateStyle(id, updates, activeBreakpoint);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleColor = TYPE_COLOR[nodeType as keyof typeof TYPE_COLOR] ?? "#6366f1";
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
        onPointerDown={(event) => handlePointerDown(event, "right")}
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
        onPointerDown={(event) => handlePointerDown(event, "bottom")}
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
        onPointerDown={(event) => handlePointerDown(event, "bottom-right")}
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
