import React, { useRef, useState } from 'react';
import { parseFileStream, ParsedObject } from './parser';

const LoadSave: React.FC = () => {
  const [fileContent, setFileContent] = useState<ParsedObject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFile = async (file: File) => {
    const stream = file.stream();
    const parsedData = await parseFileStream(stream);
    setFileContent(parsedData);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
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

      {fileContent && (
        <div className="row">
          <span>{fileContent.player}</span>
          <span>{fileContent.RUS.import}</span>
        </div>
      )}
    </div>
  );
};

export default LoadSave;
