import React, { useState } from 'react';
import { parseFileStream } from '../components/parser';

const JsonExporter: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [jsonResult, setJsonResult] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        let results: Record<string, any> = {};
        for (const file of Array.from(files)) {
          const fileNameWithoutExt = file.name.split('.')[0];
          const parsedResult = await parseFileStream(file.stream());
          setFileName(fileNameWithoutExt);
          if (files.length === 1) {
            results = parsedResult;
          } else {
            results[fileNameWithoutExt] = parsedResult;
          }
        }
        setJsonResult(JSON.stringify(results, null, 2));
      } catch (error) {
        console.error('Error parsing file(s):', error);
      }
    }
  };

  const downloadJson = () => {
    if (jsonResult) {
      const blob = new Blob([jsonResult], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName + '.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <input
        className="btn"
        type="file"
        accept=".txt, .lua"
        onChange={handleFileChange}
        multiple
      />
      {jsonResult && (
        <div>
          <button className="btn" onClick={downloadJson}>
            Download JSON
          </button>
        </div>
      )}
    </>
  );
};

export default JsonExporter;
