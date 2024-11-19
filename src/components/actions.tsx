export type Action =
  | { type: 'SET_WORLD'; payload: Object }
  | { type: 'SET_ACTIVE_TAB'; payload: String }
  | { type: 'TOGGLE_TOOLS'; payload: Boolean }
  | { type: 'SET_LOAD_STATUS'; payload: String }
  | { type: 'SET_LOAD_PROGRESS'; payload: number }
  | { type: 'CLEAR_SELECTED_FILE' };
