import type { Breakpoint, Node, StyleMap } from "../../types/schema.ts";

const bpOrder: Breakpoint[] = ["desktop", "tablet", "mobile"];

export const mergeResponsiveStyle = (
  node: Node,
  activeBreakpoint: Breakpoint,
): StyleMap => {
  const style: StyleMap = {};
  const maxIndex = bpOrder.indexOf(activeBreakpoint);
  for (let index = 0; index <= maxIndex; index += 1) {
    Object.assign(style, node.styleByBreakpoint[bpOrder[index]]);
  }
  return style;
};
