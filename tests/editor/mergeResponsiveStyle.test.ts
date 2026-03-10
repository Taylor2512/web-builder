import test from "node:test";
import assert from "node:assert/strict";
import { mergeResponsiveStyle } from "../../src/editor/canvas/renderers/mergeResponsiveStyle.ts";
import type { Node } from "../../src/editor/types/schema.ts";

const node: Node = {
  id: "text-1",
  type: "text",
  props: { text: "Hi", tag: "p", align: "left" },
  children: [],
  styleByBreakpoint: {
    desktop: { color: "red", fontSize: 16, marginTop: 12 },
    tablet: { fontSize: 14 },
    mobile: { color: "blue" },
  },
};

test("mergeResponsiveStyle merges desktop + tablet styles for tablet", () => {
  assert.deepEqual(mergeResponsiveStyle(node, "tablet"), {
    color: "red",
    fontSize: 14,
    marginTop: 12,
  });
});

test("mergeResponsiveStyle merges all breakpoints up to mobile", () => {
  assert.deepEqual(mergeResponsiveStyle(node, "mobile"), {
    color: "blue",
    fontSize: 14,
    marginTop: 12,
  });
});
