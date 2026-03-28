import LoadSave from './LoadSave';
import './App.css';
import { useReducer } from 'react';
import { reducer } from './reducer';
import { initialState } from './types';
import Main from './Main';
import AppNav from './AppNav';
import { DataProvider } from './DataContext';
import ModSelector from './ModSelector';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Population from './Population';
import PopsNeeds from './PopsNeeds';
import Production from './production/Production';

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

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <DataProvider>
      {state.world ? (
        <BrowserRouter>
          <AppNav />
          <Main appState={state} />
          <Routes>
            <Route
              path="/"
              element={
                <Population
                  provinces={getProvinces(state.world, state.world.player)}
                />
              }
            />

            <Route
              path="/population"
              element={
                <Population
                  provinces={getProvinces(state.world, state.world.player)}
                />
              }
            />

            <Route
              path="/pops-needs"
              element={
                <PopsNeeds
                  provinces={getProvinces(state.world, state.world.player)}
                  plurality={state.world[state.world.player].plurality}
                  inventions={
                    state.world[state.world.player].active_inventions.key
                  }
                />
              }
            />

            <Route
              path="/production"
              element={<Production saveData={state.world} />}
            />
          </Routes>
        </BrowserRouter>
      ) : (
        <>
          <ModSelector />
          <LoadSave dispatch={dispatch} state={state} />
        </>
      )}
    </DataProvider>
  );
};

export default App;
