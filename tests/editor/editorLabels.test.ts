import test from 'node:test'
import assert from 'node:assert/strict'
import { EDITOR_LABELS, getEditorLabel } from '../../src/editor/i18n/editorLabels.es-en.ts'

test('getEditorLabel resolves localized labels for both locales', () => {
  assert.equal(getEditorLabel('es', 'topbar.search'), 'Buscar')
  assert.equal(getEditorLabel('en', 'topbar.search'), 'Search')
})

test('getEditorLabel falls back to english when localized value is empty', () => {
  const original = EDITOR_LABELS.es['topbar.search']

  EDITOR_LABELS.es['topbar.search'] = ''
  assert.equal(getEditorLabel('es', 'topbar.search'), 'Search')

  EDITOR_LABELS.es['topbar.search'] = original
})

test('all locales cover the same label keys with non-empty text', () => {
  const englishKeys = Object.keys(EDITOR_LABELS.en).sort()
  const spanishKeys = Object.keys(EDITOR_LABELS.es).sort()

  assert.deepEqual(spanishKeys, englishKeys)

  for (const locale of Object.keys(EDITOR_LABELS) as Array<keyof typeof EDITOR_LABELS>) {
    for (const key of englishKeys) {
      assert.notEqual(EDITOR_LABELS[locale][key as keyof typeof EDITOR_LABELS.en].trim().length, 0)
    }
  }
})

test('required editor domains are represented in label keys', () => {
  const keys = Object.keys(EDITOR_LABELS.en)

  assert.ok(keys.some((key) => key.startsWith('topbar.')))
  assert.ok(keys.some((key) => key.startsWith('pageMenu.')))
  assert.ok(keys.some((key) => key.startsWith('search.')))
  assert.ok(keys.some((key) => key.startsWith('addDrawer.')))
  assert.ok(keys.some((key) => key.startsWith('inspector.')))
  assert.ok(keys.some((key) => key.startsWith('panelAction.')))
})
