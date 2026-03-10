import type { NodeType, NodesById } from "../../types/schema.ts";

const CONTAINER_TYPES: NodeType[] = ["page", "section", "container", "grid", "repeater"];

export const findParentId = (nodesById: NodesById, childId: string) =>
  Object.values(nodesById).find((node) => node.children.includes(childId))?.id;

export const isDescendant = (
  nodesById: NodesById,
  ancestorId: string,
  targetId: string,
): boolean => {
  const node = nodesById[ancestorId];
  if (!node) return false;
  if (node.children.includes(targetId)) return true;
  return node.children.some((childId) => isDescendant(nodesById, childId, targetId));
};

export const resolveDropParent = (
  overId: string | null,
  nodesById: NodesById,
  rootId: string,
): string => {
  if (!overId) return rootId;
  if (overId.startsWith("drop-")) return overId.replace("drop-", "");
  const overNode = nodesById[overId];
  if (!overNode) return rootId;
  if (CONTAINER_TYPES.includes(overNode.type)) return overNode.id;
  return findParentId(nodesById, overNode.id) ?? rootId;
};

export const resolveDropIndex = (
  overId: string | null,
  parentId: string,
  nodesById: NodesById,
): number | undefined => {
  if (!overId || overId.startsWith("drop-")) return undefined;
  const parentNode = nodesById[parentId];
  if (!parentNode) return undefined;
  const index = parentNode.children.findIndex((childId) => childId === overId);
  return index >= 0 ? index : undefined;
};

export const hasChildCapacity = (
  parentId: string,
  nodesById: NodesById,
  maxChildrenByType: Partial<Record<NodeType, number>>,
): boolean => {
  const parent = nodesById[parentId];
  if (!parent) return false;
  const max = maxChildrenByType[parent.type];
  return typeof max !== "number" || parent.children.length < max;
};

export const isAllowedParent = (
  childType: NodeType,
  parentType: NodeType,
  allowedParents: Partial<Record<NodeType, NodeType[]>>,
): boolean => {
  const allowed = allowedParents[childType];
  return !allowed || allowed.includes(parentType);
};
