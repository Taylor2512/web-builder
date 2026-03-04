import BlocksPanel from "./BlocksPanel";
import Canvas from "../canvas/Canvas";
import Inspector from "../inspector/Inspector";

export default function FormBuilder() {
  return (
    <div style={styles.shell}>
      <header style={styles.topbar}>
        <div style={styles.brand}>Web Builder</div>
        <div style={styles.topbarRight}>
          <span style={styles.badge}>MVP</span>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.left}>
          <BlocksPanel />
        </aside>

        <section style={styles.center}>
          <Canvas />
        </section>

        <aside style={styles.right}>
          <Inspector />
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { height: "100vh", display: "flex", flexDirection: "column" },
  topbar: {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(255,255,255,.02)",
    backdropFilter: "blur(8px)",
  },
  brand: { fontWeight: 800, letterSpacing: 0.4 },
  topbarRight: { display: "flex", alignItems: "center", gap: 10 },
  badge: {
    fontSize: 12,
    color: "var(--muted)",
    border: "1px solid var(--border)",
    padding: "4px 8px",
    borderRadius: 999,
    background: "var(--surface)",
  },
  main: { flex: 1, display: "grid", gridTemplateColumns: "280px 1fr 340px" },
  left: { borderRight: "1px solid var(--border)", background: "var(--panel)" },
  center: { background: "transparent" },
  right: { borderLeft: "1px solid var(--border)", background: "var(--panel)" },
};
