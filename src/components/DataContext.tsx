import React, { createContext, useContext, useState } from 'react';

type DataContextType = {
  mod: string;
  setMod: (folder: string) => void;
  data: any;
  loadJsonFiles: (files: string[]) => Promise<void>;
  loadCsvFiles: (files: string[]) => Promise<void>;
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
        const path = `/assets/${mod}/${file}`;
        const key = file.split('/').slice(-1)[0].split('.')[0];

        const response = await fetch(path); // Fetch file
        if (!response.ok) {
          throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
        }

        const jsonData = await response.json(); // Parse JSON
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
      throw error; // Optional: Re-throw the error to handle it elsewhere
    }
  };

  const loadCsvFiles = async (files: string[]) => {
    try {
      const csvPromises = files.map(async (file) => {
        const path = `${mod}/${file}`;
        const key = file.split('/').slice(-1)[0].split('.')[0];
        const response = await fetch(path);
        const csvContent = await response.text();

        return { key, csvContent };
      });

      // Wait for all files to be loaded
      const results = await Promise.all(csvPromises);

      setData((prevData: any) =>
        results.reduce(
          (acc, { key, csvContent }) => ({
            ...acc,
            [key]: csvContent,
          }),
          { ...prevData } // Preserve existing data
        )
      );
    } catch (error) {
      console.error('Failed to load CSV files:', error);
    }
  };

  return (
    <DataContext.Provider
      value={{ mod, setMod, data, loadJsonFiles, loadCsvFiles }}
    >
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
