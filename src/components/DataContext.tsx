import React, { createContext, useContext, useState } from 'react';

type DataContextType = {
  mod: string;
  setMod: (folder: string) => void;
  data: any;
  loadJsonFiles: (files: string[]) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mod, setMod] = useState<string>('');
  const [data, setData] = useState<any>(null);

  const loadJsonFiles = async (files: string[]) => {
    try {
      const jsonPromises = files.map(async (file) => {
        const path = `../assets/${mod}/${file}`;
        const key = file.split('/').slice(-1)[0].split('.')[0];
        const jsonData = await import(path);

        return { key, jsonData };
      });

      // Wait for all files to be loaded
      const results = await Promise.all(jsonPromises);

      // Update state with all the loaded data
      setData((prevData: any) =>
        results.reduce(
          (acc, { key, jsonData }) => ({
            ...acc,
            [key]: jsonData,
          }),
          { ...prevData } // Preserve existing data
        )
      );
    } catch (error) {
      console.error('Failed to load JSON files:', error);
    }
  };

  return (
    <DataContext.Provider value={{ mod, setMod, data, loadJsonFiles }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
