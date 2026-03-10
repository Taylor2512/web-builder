import type { Breakpoint, Node, StyleMap } from "../../types/schema.ts";

const bpOrder: Breakpoint[] = ["desktop", "tablet", "mobile"];

export const mergeResponsiveStyle = (
  node: Node,
  activeBreakpoint: Breakpoint,
): StyleMap => {
  const style: StyleMap = {};
  const maxIndex = bpOrder.indexOf(activeBreakpoint);
  for (let index = 0; index <= maxIndex; index += 1) {
    const breakpointStyle = node.styleByBreakpoint[bpOrder[index]];
    for (const [key, value] of Object.entries(breakpointStyle)) {
      if (value !== undefined) style[key] = value;
    }
  }
  return style;
};
