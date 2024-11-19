import { AppState } from './types';
import { Action } from './actions';

export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_WORLD':
      return {
        ...state,
        world: action.payload,
      };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'TOGGLE_TOOLS':
      return { ...state, showTools: action.payload };
    case 'SET_LOAD_STATUS':
      return { ...state, loadStatus: action.payload };
    case 'SET_LOAD_PROGRESS':
      return { ...state, loadProgress: action.payload };
    default:
      return state;
  }
};
