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
    console.log('🔄 ConflictDataProvider initializing...');
    
    // Subscribe to real-time updates
    const unsubscribe = conflictDataService.subscribe((newData) => {
      console.log('📊 ConflictDataProvider received new data:', newData);
      setData(newData);
      setLoading(false);
      setError(null);
    });

    // Initial data load with timeout fallback
    const loadData = async () => {
      try {
        await refreshData();
      } catch (err) {
        console.error('❌ Initial data load failed:', err);
        // Force loading to false even if there's an error to show current data
        setTimeout(() => {
          console.log('⏰ Timeout reached, forcing loading to false');
          setLoading(false);
        }, 10000); // 10 second timeout
      }
    };

    loadData();

    return unsubscribe;
  }, []);

  const refreshData = async () => {
    console.log('🔄 RefreshData called...');
    try {
      setLoading(true);
      console.log('📡 Calling conflictDataService.fetchLatestData()...');
      const newData = await conflictDataService.fetchLatestData();
      console.log('✅ Got new data from service:', newData);
      setData(newData);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching conflict data:', err);
      setError('Failed to fetch latest data');
    } finally {
      console.log('✅ RefreshData completed, setting loading to false');
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