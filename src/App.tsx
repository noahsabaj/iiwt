import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { crisisTheme } from './theme';
import { ConflictDataProvider } from './contexts/ConflictDataContext';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <ThemeProvider theme={crisisTheme}>
      <CssBaseline />
      <ConflictDataProvider>
        <Dashboard />
      </ConflictDataProvider>
    </ThemeProvider>
  );
}

export default App;
