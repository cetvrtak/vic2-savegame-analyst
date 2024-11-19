import React, { useRef, useState } from 'react';
import { parseFileStream } from './parser';
import { Action } from './actions';
import { AppState } from './types';

type LoadSaveProps = { dispatch: React.Dispatch<Action>; state: AppState };

const LoadSave: React.FC<LoadSaveProps> = ({ dispatch, state }) => {
  const [fileSelected, setFileSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFile = async (file: File) => {
    const stream = file.stream();
    const parsedData = await parseFileStream(stream, dispatch, file.size);
    dispatch({ type: 'SET_WORLD', payload: parsedData });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
      setFileSelected(true);
    }
  };

  return !fileSelected ? (
    <div className="btn-wrapper file-input-wrapper">
      <button className="btn" onClick={handleClick}>
        Load save
      </button>
      <input
        type="file"
        ref={fileInputRef}
        className="file-input"
        onChange={handleFileChange}
      />
    </div>
  ) : (
    <div>
      <h2>{state.loadStatus}</h2>
      <progress value={state.loadProgress} max="100" />
    </div>
  );
};

export default LoadSave;
