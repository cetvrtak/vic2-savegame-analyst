import React, { useRef, useState } from 'react';
import { parseFileStream } from './parser';
import { Action } from './actions';

type LoadSaveProps = { dispatch: React.Dispatch<Action> };

const LoadSave: React.FC<LoadSaveProps> = ({ dispatch }) => {
  const [fileSelected, setFileSelected] = useState<Boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFile = async (file: File) => {
    const stream = file.stream();
    const parsedData = await parseFileStream(stream);
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
    <div>
      <div className="file-input-wrapper">
        <button className="custom-file-button" onClick={handleClick}>
          Load save
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="file-input"
          onChange={handleFileChange}
        />
      </div>
    </div>
  ) : (
    <h2>Loading ...</h2>
  );
};

export default LoadSave;
