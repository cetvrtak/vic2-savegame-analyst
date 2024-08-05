import LoadSave from './LoadSave';
import './App.css';
import { useReducer } from 'react';
import { reducer } from './reducer';
import { initialState } from './types';
import Main from './Main';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return !state.world ? (
    <LoadSave dispatch={dispatch} />
  ) : (
    <Main world={state.world} />
  );
};

export default App;
