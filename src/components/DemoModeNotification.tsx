import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Link,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { configService } from '../services/ConfigService';

const DemoModeNotification: React.FC = () => {
  const [open, setOpen] = useState(true);
  const config = configService.getConfig();

  // Only show if in demo mode
  if (!config.isDemoMode) {
    return null;
  }

  return (
    <Collapse in={open}>
      <Alert
        severity="info"
        icon={<InfoIcon />}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setOpen(false)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          mb: 2,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          '& .MuiAlert-icon': {
            color: '#2196f3',
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>Running in Demo Mode</AlertTitle>
        <Box>
          You're viewing simulated data. To see real-time conflict data:
          <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>
              Get free API keys from{' '}
              <Link href="https://newsapi.org/register" target="_blank" rel="noopener">
                NewsAPI
              </Link>
              ,{' '}
              <Link href="https://firms.modaps.eosdis.nasa.gov/api/" target="_blank" rel="noopener">
                NASA FIRMS
              </Link>
              , and other providers
            </li>
            <li>
              Copy <code>.env.example</code> to <code>.env.local</code> and add your keys
            </li>
            <li>
              See{' '}
              <Link href="https://github.com/noahsabaj/iiwt#setup" target="_blank" rel="noopener">
                setup instructions
              </Link>{' '}
              for details
            </li>
          </ol>
          <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
            Note: Some APIs require a proxy server due to CORS restrictions. Check PROXY_SETUP.md for details.
          </Box>
        </Box>
      </Alert>
    </Collapse>
  );
};

export default DemoModeNotification;