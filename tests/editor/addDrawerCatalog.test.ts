import test from "node:test";
import assert from "node:assert/strict";
import { ADD_DRAWER_CATALOG, getItemsByCategory } from "../../src/editor/add-drawer/addDrawerCatalog.ts";

test("all categories are non-empty", () => {
  assert.ok(ADD_DRAWER_CATALOG.categories.length > 0);

  for (const category of ADD_DRAWER_CATALOG.categories) {
    const items = getItemsByCategory(category.id);
    assert.ok(items.length > 0, `Category ${category.id} should contain at least one item`);
  }
});

test("category and item ids are unique", () => {
  const categoryIds = ADD_DRAWER_CATALOG.categories.map((category) => category.id);
  const itemIds = ADD_DRAWER_CATALOG.items.map((item) => item.id);

  assert.equal(new Set(categoryIds).size, categoryIds.length, "Category ids must be unique");
  assert.equal(new Set(itemIds).size, itemIds.length, "Item ids must be unique");
});

test("all items reference a valid category", () => {
  const categoryIds = new Set(ADD_DRAWER_CATALOG.categories.map((category) => category.id));

  for (const item of ADD_DRAWER_CATALOG.items) {
    assert.ok(categoryIds.has(item.categoryId), `Item ${item.id} points to an unknown category`);
  }
});
