import test from "node:test";
import assert from "node:assert/strict";
import { getRenderableChildIds } from "../../src/editor/canvas/renderers/nodeVisibility.ts";
import type { Node } from "../../src/editor/types/schema.ts";

const hiddenSection: Node = {
  id: "section-1",
  type: "section",
  props: { name: "Section" },
  styleByBreakpoint: { desktop: {}, tablet: {}, mobile: {} },
  children: ["text-1", "text-2"],
  isHidden: true,
};

test("hidden nodes keep their child structure for rendering traversal", () => {
  assert.deepEqual(getRenderableChildIds(hiddenSection), ["text-1", "text-2"]);
});
