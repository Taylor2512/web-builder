import test from 'node:test'
import assert from 'node:assert/strict'
import { pageSwitcherMenuReducer } from '../../src/editor/topbar/pageSwitcherMenuReducer.ts'

test('pageSwitcherMenuReducer toggles menu open and closed', () => {
  const opened = pageSwitcherMenuReducer({ isOpen: false }, { type: 'toggle' })
  const closed = pageSwitcherMenuReducer(opened, { type: 'toggle' })

  assert.equal(opened.isOpen, true)
  assert.equal(closed.isOpen, false)
})

test('pageSwitcherMenuReducer closes menu for outside/escape events', () => {
  const closedFromOutsideClick = pageSwitcherMenuReducer({ isOpen: true }, { type: 'close' })
  const closedFromEscape = pageSwitcherMenuReducer({ isOpen: true }, { type: 'close' })

  assert.equal(closedFromOutsideClick.isOpen, false)
  assert.equal(closedFromEscape.isOpen, false)
})

test('pageSwitcherMenuReducer closes menu after page selection', () => {
  const selected = pageSwitcherMenuReducer({ isOpen: true }, { type: 'select' })
  assert.equal(selected.isOpen, false)
})
