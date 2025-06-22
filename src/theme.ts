import { createTheme } from '@mui/material/styles';

export const crisisTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d32f2f', // Crisis red
      dark: '#9a0007',
      light: '#ff6659',
    },
    secondary: {
      main: '#ff5722', // Orange alert
      dark: '#c41c00',
      light: '#ff8a50',
    },
    error: {
      main: '#f44336',
      dark: '#ba000d',
      light: '#ff7961',
    },
    warning: {
      main: '#ff9800',
      dark: '#c66900',
      light: '#ffb74d',
    },
    background: {
      default: '#0a0a0a', // Almost black
      paper: '#1a1a1a', // Dark grey
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Courier New", monospace', // Military-style monospace
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#d32f2f',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#ff5722',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          boxShadow: '0 4px 8px rgba(211, 47, 47, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '0.5px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});