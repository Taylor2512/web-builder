import test from "node:test";
import assert from "node:assert/strict";
import type { FormField } from "../../src/editor/types/schema.ts";
import { parseFieldValue, validateFieldValue, validateFormFields } from "../../src/editor/forms/validators.ts";

const makeField = (overrides: Partial<FormField> = {}): FormField => ({
  id: "field-1",
  type: "text",
  label: "Name",
  name: "name",
  ...overrides,
});

test("validateFieldValue validates required checkbox/radio/select", () => {
  assert.equal(validateFieldValue(makeField({ type: "checkbox", required: true }), false), "Name is required");
  assert.equal(validateFieldValue(makeField({ type: "radio", required: true }), ""), "Name is required");
  assert.equal(validateFieldValue(makeField({ type: "select", required: true }), ""), "Name is required");
});

test("validateFieldValue validates min/max for number fields", () => {
  const field = makeField({ type: "number", label: "Age", min: 18, max: 65 });
  assert.equal(validateFieldValue(field, 12), "Age min 18");
  assert.equal(validateFieldValue(field, 70), "Age max 65");
  assert.equal(validateFieldValue(field, 22), null);
});

test("validateFieldValue validates email and pattern", () => {
  assert.equal(validateFieldValue(makeField({ type: "email", label: "Email" }), "bad-email"), "Email must be an email");
  assert.equal(validateFieldValue(makeField({ label: "Code", pattern: "^[A-Z]{3}$" }), "AB12"), "Code invalid format");
  assert.equal(validateFieldValue(makeField({ label: "Code", pattern: "^[A-Z]{3}$" }), "ABC"), null);
});

test("parseFieldValue parses booleans and numbers", () => {
  const data = new FormData();
  data.set("agree", "on");
  data.set("age", "25");

  assert.equal(parseFieldValue(makeField({ type: "checkbox", name: "agree" }), data), true);
  assert.equal(parseFieldValue(makeField({ type: "number", name: "age" }), data), 25);
});

test("validateFormFields returns errors by field name and payload", () => {
  const fields: FormField[] = [
    makeField({ name: "email", label: "Email", type: "email", required: true }),
    makeField({ name: "age", label: "Age", type: "number", min: 18 }),
  ];

  const data = new FormData();
  data.set("email", "bad-email");
  data.set("age", "16");

  const result = validateFormFields(fields, data);

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, {
    email: "Email must be an email",
    age: "Age min 18",
  });
  assert.deepEqual(result.payload, {
    email: "bad-email",
    age: 16,
  });
});
