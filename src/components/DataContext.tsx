import React, { createContext, useContext, useState } from 'react';

type DataContextType = {
  mod: string;
  setMod: (folder: string) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mod, setMod] = useState<string>('');

  return (
    <DataContext.Provider value={{ mod, setMod }}>
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
