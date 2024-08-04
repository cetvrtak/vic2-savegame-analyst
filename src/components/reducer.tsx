import { AppState } from './types';
import { Action } from './actions';

export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_WORLD':
      return {
        ...state,
        world: action.payload,
      };
    default:
      return state;
  }
};
