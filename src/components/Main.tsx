import TabSelector from './TabSelector';
import { AppState } from './types';
import { Action } from './actions';

type MainProps = { appState: AppState; dispatch: React.Dispatch<Action> };

const Main: React.FC<MainProps> = ({ appState, dispatch }) => {

  return (
    <main className="row">
      <span>
        Player tag ~ <strong>{appState.world.player}</strong>
      </span>

      <TabSelector dispatch={dispatch} />
    </main>
  );
};

export default Main;
