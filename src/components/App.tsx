import LoadSave from './LoadSave';
import './App.css';
import { useReducer } from 'react';
import { reducer } from './reducer';
import { initialState } from './types';
import Main from './Main';
import Header from './Header';
import { DataProvider } from './DataContext';
import ModSelector from './ModSelector';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      <Header dispatch={dispatch} />

      <DataProvider>
        <ModSelector />
        {!state.world ? (
          <LoadSave dispatch={dispatch} state={state} />
        ) : (
          <Main appState={state} />
        )}
      </DataProvider>
    </>
  );
};

export default App;
