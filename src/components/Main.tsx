import TabSelector from './TabSelector';
import { AppState } from './types';
import { Action } from './actions';
import Population from './Population';
import PopsNeeds from './PopsNeeds';

type MainProps = { appState: AppState; dispatch: React.Dispatch<Action> };

type World = {
  [key: string]: any;
};

const getProvinces = (world: World, country: string): any[] => {
  const provinces = [];
  for (const key in world) {
    if (!isNaN(Number(key)) && world[key].owner === country) {
      provinces.push(world[key]);
    }
  }
  return provinces;
};

const Main: React.FC<MainProps> = ({ appState, dispatch }) => {

  return (
    <main className="row">
      <span>
        Player tag ~ <strong>{appState.world.player}</strong>
      </span>

      <TabSelector dispatch={dispatch} />

      {appState.activeTab === 'population' && (
        <Population
          provinces={getProvinces(appState.world, appState.world.player)}
        />
      )}
      {appState.activeTab === 'popsNeeds' && (
        <PopsNeeds
          provinces={getProvinces(appState.world, appState.world.player)}
          plurality={appState.world[appState.world.player].plurality}
          inventions={
            appState.world[appState.world.player].active_inventions.key
          }
        />
      )}
    </main>
  );
};

export default Main;
