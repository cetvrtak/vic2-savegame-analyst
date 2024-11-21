import React from 'react';
import { useData } from './DataContext';

const ModSelector: React.FC = () => {
  const { mod, setMod } = useData();
  if (mod) return;

  const handleModSelection = (folder: string) => {
    setMod(folder);
  };

  return (
    <div>
      <button onClick={() => handleModSelection('/')}>Load Vanilla</button>
      <button onClick={() => handleModSelection('/HPM')}>Load HPM</button>
    </div>
  );
};

export default ModSelector;
