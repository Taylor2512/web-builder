import test from "node:test";
import assert from "node:assert/strict";
import { validateField } from "../../src/editor/forms/validation.ts";
import type { FormField } from "../../src/editor/types/schema.ts";

const makeField = (overrides: Partial<FormField> = {}): FormField => ({
  id: "field-1",
  type: "text",
  label: "Name",
  name: "name",
  ...overrides,
});

test("validateField validates required values", () => {
  assert.equal(validateField(makeField({ required: true }), ""), "Name is required");
});

test("validateField validates email format", () => {
  assert.equal(
    validateField(makeField({ type: "email", label: "Email" }), "bad-email"),
    "Email must be an email",
  );
});

test("validateField validates pattern and accepts valid value", () => {
  assert.equal(
    validateField(makeField({ label: "Code", pattern: "^[A-Z]{3}$" }), "ABC"),
    null,
  );
  assert.equal(
    validateField(makeField({ label: "Code", pattern: "^[A-Z]{3}$" }), "AB12"),
    "Code invalid format",
  );
});
