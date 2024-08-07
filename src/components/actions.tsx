export type Action =
  | { type: 'SET_WORLD'; payload: Object }
  | { type: 'SET_ACTIVE_TAB'; payload: String }
  | { type: 'CLEAR_SELECTED_FILE' };
