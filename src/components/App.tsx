import LoadSave from './LoadSave';
import './App.css';
import { useReducer } from 'react';
import { reducer } from './reducer';
import { initialState } from './types';
import Main from './Main';
import Header from './Header';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      <Header dispatch={dispatch} />

      {!state.world ? (
        <LoadSave dispatch={dispatch} state={state} />
      ) : (
        <Main appState={state} />
      )}
    </>
  );
};

export default App;
