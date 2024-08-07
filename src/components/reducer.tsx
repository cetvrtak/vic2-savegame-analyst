﻿import { AppState } from './types';
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
    default:
      return state;
  }
};
