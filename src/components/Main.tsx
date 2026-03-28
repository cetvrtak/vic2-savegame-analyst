import { AppState } from './types';

type MainProps = { appState: AppState };

const Main: React.FC<MainProps> = ({ appState }) => {
  return (
    <main className="row">
      <span>
        Player tag ~ <strong>{appState.world.player}</strong>
      </span>
    </main>
  );
};

export default Main;
