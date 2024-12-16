import React from 'react';
import { useData } from './DataContext';

const ModSelector: React.FC = () => {
  const { mod, setMod } = useData();
  if (mod) return;

  const handleModSelection = (folder: string) => {
    setMod(folder);
  };

  return (
    <div className='btn-wrapper file-input-wrapper mod-selector-wrapper'>
      <h2 className='mod-selector-title'>Select mod</h2>
      <button className='btn mod-selector-btn' onClick={() => handleModSelection('')}>Vanilla</button>
      <button className='btn mod-selector-btn' onClick={() => handleModSelection('HPM')}>HPM</button>
    </div>
  );
};

export default ModSelector;
