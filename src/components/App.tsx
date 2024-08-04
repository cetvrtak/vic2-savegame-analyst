import LoadSave from './LoadSave';
import './App.css';
import { useReducer } from 'react';
import { reducer } from './reducer';
import { initialState } from './types';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return !state.world ? (
    <LoadSave dispatch={dispatch} />
  ) : (
    <main>
      <div className="row">
        <span>{state.world['player']}</span>
      </div>
    </main>
  );
};

export default App;
