import React, { useState } from 'react';
import { parseFileStream } from '../components/parser';

const JsonExporter: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [jsonResult, setJsonResult] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      try {
        const parsedResult = await parseFileStream(file.stream());
        setJsonResult(JSON.stringify(parsedResult, null, 2));
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    }
  };

  const downloadJson = () => {
    if (jsonResult) {
      const blob = new Blob([jsonResult], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName?.split('.')[0] + '.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Render nothing if not in development environment
  }

  return (
    <div className="json-exporter btn-wrapper">
      <h2 className="json-exporter-title">JSON Exporter</h2>
      <input
        className="btn"
        type="file"
        accept=".txt, .lua"
        onChange={handleFileChange}
      />
      {jsonResult && (
        <div>
          <button className="btn" onClick={downloadJson}>
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default JsonExporter;
