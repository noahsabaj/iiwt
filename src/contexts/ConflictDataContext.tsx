import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ConflictData } from '../types';
import { conflictDataService } from '../services/ConflictDataService';

interface ConflictDataContextType {
  data: ConflictData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const ConflictDataContext = createContext<ConflictDataContextType | undefined>(undefined);

export const useConflictData = () => {
  const context = useContext(ConflictDataContext);
  if (context === undefined) {
    throw new Error('useConflictData must be used within a ConflictDataProvider');
  }
  return context;
};

interface ConflictDataProviderProps {
  children: ReactNode;
}

export const ConflictDataProvider: React.FC<ConflictDataProviderProps> = ({ children }) => {
  const [data, setData] = useState<ConflictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = conflictDataService.subscribe((newData) => {
      setData(newData);
      setLoading(false);
      setError(null);
    });

    // Initial data load
    refreshData();

    return unsubscribe;
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const newData = await conflictDataService.fetchLatestData();
      setData(newData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch latest data');
      console.error('Error fetching conflict data:', err);
    } finally {
      setLoading(false);
    }
  };

  const contextValue: ConflictDataContextType = {
    data,
    loading,
    error,
    refreshData,
  };

  return (
    <ConflictDataContext.Provider value={contextValue}>
      {children}
    </ConflictDataContext.Provider>
  );
};