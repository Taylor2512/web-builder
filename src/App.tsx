import React from "react";
import "./App.css";
import BlocksPanel from "./editor/blocks/BlocksPanel";
import Canvas from "./editor/canvas/Canvas";
import Inspector from "./editor/inspector/Inspector";

function App() {
  return (
    <div>
      <aside>
        <BlocksPanel />
      </aside>
      <main style={{ flex: 1, padding: 12, overflow: "auto" }}>
        <Canvas />
      </main>
      <aside>
        <Inspector />
      </aside>
    </div>
  );
}

export default App;
