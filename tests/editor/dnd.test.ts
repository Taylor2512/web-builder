import test from "node:test";
import assert from "node:assert/strict";
import { resolveDropParent } from "../../src/editor/canvas/interaction/dnd.ts";

const nodesById = {
  root: {
    id: "root",
    type: "page",
    props: { title: "Root" },
    styleByBreakpoint: { desktop: {}, tablet: {}, mobile: {} },
    children: ["section-1"],
  },
  "section-1": {
    id: "section-1",
    type: "section",
    props: { name: "Section" },
    styleByBreakpoint: { desktop: {}, tablet: {}, mobile: {} },
    children: ["text-1"],
  },
  "text-1": {
    id: "text-1",
    type: "text",
    props: { text: "Hello", tag: "p", align: "left" },
    styleByBreakpoint: { desktop: {}, tablet: {}, mobile: {} },
    children: [],
  },
};

test("resolveDropParent uses explicit drop container id", () => {
  assert.equal(resolveDropParent("drop-section-1", nodesById as never, "root"), "section-1");
});

test("resolveDropParent returns over node when it is a container", () => {
  assert.equal(resolveDropParent("section-1", nodesById as never, "root"), "section-1");
});

test("resolveDropParent falls back to parent for non-container node", () => {
  assert.equal(resolveDropParent("text-1", nodesById as never, "root"), "section-1");
});
