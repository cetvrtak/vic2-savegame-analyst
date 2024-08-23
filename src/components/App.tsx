import TabSelector from './TabSelector';
import LoadSave from './LoadSave';
import './App.css';
import { useReducer } from 'react';
import { reducer } from './reducer';
import { initialState } from './types';
import Main from './Main';
import JsonExporter from '../tools/JsonExporter';
import TerrainMapper from '../tools/TerrainMapper';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      <TabSelector dispatch={dispatch} />
      <JsonExporter />
      <TerrainMapper />

      {!state.world ? (
        <LoadSave dispatch={dispatch} />
      ) : (
        <Main appState={state} />
      )}
    </>
  );
};

export default App;
