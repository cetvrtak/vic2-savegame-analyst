import React, { useEffect, useState } from 'react';
import { parseFileStream } from '../components/parser';

const JsonExporter: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const [jsonResult, setJsonResult] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [mergeObjects, setMergeObjects] = useState<Boolean>(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFiles(event.target.files);
  };

  useEffect(() => {
    const generateJson = async () => {
      if (files && files.length > 0) {
        try {
          let results: Record<string, any> = {};
          for (const file of Array.from(files)) {
            const fileNameWithoutExt = file.name.split('.')[0];
            const parsedResult = await parseFileStream(file.stream(), () => {});
            setFileName(fileNameWithoutExt);
            if (files.length === 1 || mergeObjects) {
              results = { ...results, ...parsedResult };
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
    generateJson();
  }, [files, mergeObjects]);

  const handleCheckboxToggle = () => {
    setMergeObjects((merge) => !merge);
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
      {files && files.length > 1 && (
        <label className="tool-box-checkbox" onClick={handleCheckboxToggle}>
          <input type="checkbox" />
          <span>Merge objects</span>
        </label>
      )}
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
