import { create } from "zustand";
import { produce } from "immer";
import type { Node, NodesById } from "../types/schema";
import { createNode } from "../types/schema";
import { themes } from "../utils/themes";

type EditorState = {
  nodesById: NodesById;
  rootId: string;
  selectedId?: string;
  history: NodesById[];
  historyIndex: number;
  addNode: (parentId: string, nodeOrType: Node | Node["type"]) => void;
  removeNode: (id: string) => void;
  updateNodeProps: (id: string, props: Partial<Node["p"]>) => void;
  updateNodeStyle: (id: string, style: Partial<Node["s"]>) => void;
  selectNode: (id?: string) => void;
  undo: () => void;
  redo: () => void;
  currentThemeId: string;
  setTheme: (id: string) => void;
};

const initialRoot = createNode({ type: "section", id: "root" });
const defaultThemeId = themes[0].id;

export const useEditorStore = create<EditorState>((set) => ({
  nodesById: { [initialRoot.id]: initialRoot },
  rootId: initialRoot.id,
  selectedId: undefined,
  history: [],
  historyIndex: -1,
  currentThemeId: defaultThemeId,

  addNode(parentId, nodeOrType) {
    set((state) => {
      const node: Node = typeof nodeOrType === "string" ? createNode({ type: nodeOrType }) : nodeOrType;
      const next = produce(state.nodesById, (draft) => {
        draft[node.id] = node;
        const parent = draft[parentId];
        if (parent) {
          parent.c = parent.c ?? [];
          parent.c.push(node.id);
        }
      });
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(next);
      return {
        nodesById: next,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  removeNode(id) {
    set((state) => {
      const next = produce(state.nodesById, (draft) => {
        delete draft[id];
        for (const k in draft) {
          const n = draft[k];
          if (n.c) n.c = n.c.filter((c) => c !== id);
        }
      });
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(next);
      return {
        nodesById: next,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  updateNodeProps(id, props) {
    set((state) => {
      const next = produce(state.nodesById, (draft) => {
        draft[id] = {
          ...(draft[id] ?? createNode({ type: "text", id })),
          p: { ...(draft[id]?.p ?? {}), ...props },
        };
      });
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(next);
      return {
        nodesById: next,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  updateNodeStyle(id, style) {
    set((state) => {
      const next = produce(state.nodesById, (draft) => {
        draft[id] = {
          ...(draft[id] ?? createNode({ type: "text", id })),
          s: { ...(draft[id]?.s ?? {}), ...style },
        };
      });
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(next);
      return {
        nodesById: next,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  setTheme(id) {
    set({ currentThemeId: id });
    try {
      const t = themes.find((x) => x.id === id);
      if (t) {
        // apply CSS vars immediately
        import("../utils/themes").then((m) => m.applyThemeVars(t));
      }
    } catch {
      // ignore
    }
  },

  selectNode(id) {
    set({ selectedId: id });
  },

  undo() {
    set((state) => {
      const idx = Math.max(0, state.historyIndex - 1);
      if (state.history[idx]) {
        return { nodesById: state.history[idx], historyIndex: idx };
      }
      return {};
    });
  },

  redo() {
    set((state) => {
      const idx = Math.min(state.history.length - 1, state.historyIndex + 1);
      if (state.history[idx]) {
        return { nodesById: state.history[idx], historyIndex: idx };
      }
      return {};
    });
  },
}));

export default useEditorStore;
