import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
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
        </ConflictDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
