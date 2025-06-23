import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { crisisTheme } from './theme';
import { ConflictDataProvider } from './contexts/ConflictDataContext';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <ThemeProvider theme={crisisTheme}>
      <CssBaseline />
      <AuthProvider>
        <ConflictDataProvider>
          <Dashboard />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
                fontFamily: 'Roboto, sans-serif',
              },
            }}
          />
        </ConflictDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
