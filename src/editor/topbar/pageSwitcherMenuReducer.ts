export type PageSwitcherMenuState = {
  isOpen: boolean
}

export type PageSwitcherMenuAction =
  | { type: 'toggle' }
  | { type: 'close' }
  | { type: 'select' }

export function pageSwitcherMenuReducer(
  state: PageSwitcherMenuState,
  action: PageSwitcherMenuAction,
): PageSwitcherMenuState {
  switch (action.type) {
    case 'toggle':
      return { isOpen: !state.isOpen }
    case 'close':
    case 'select':
      return { isOpen: false }
    default:
      return state
  }
}
