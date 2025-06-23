import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Feed as FeedIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';
import { RateLimitedButton } from './RateLimitedButton';

interface DataSource {
  name: string;
  type: 'news' | 'government' | 'osint';
  status: 'active' | 'error' | 'pending';
  lastUpdate?: Date;
  error?: string;
}

const DataSourceIndicator: React.FC = () => {
  const { refreshData, loading } = useConflictData();
  const [expanded, setExpanded] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      name: 'NewsAPI',
      type: 'news',
      status: 'pending',
      lastUpdate: new Date()
    },
    {
      name: 'Government Sources',
      type: 'government',
      status: 'pending',
      lastUpdate: new Date()
    },
    {
      name: 'OSINT Intelligence',
      type: 'osint',
      status: 'pending',
      lastUpdate: new Date()
    }
  ]);

  // Simulate data source status updates
  useEffect(() => {
    if (loading) {
      setDataSources(sources =>
        sources.map(source => ({ ...source, status: 'pending' }))
      );
    } else {
      setDataSources(sources =>
        sources.map(source => ({
          ...source,
          status: 'active',
          lastUpdate: new Date()
        }))
      );
    }
  }, [loading]);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'news': return <FeedIcon />;
      case 'government': return <PublicIcon />;
      case 'osint': return <SecurityIcon />;
      default: return <FeedIcon />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckIcon sx={{ color: '#4caf50' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'pending': return <CircularProgress size={16} />;
      default: return <WarningIcon />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'error': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const getTimeAgo = (date?: Date): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const isLiveData = process.env.REACT_APP_NEWS_API_KEY ? true : false;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        p: 2,
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        minWidth: 200,
        zIndex: 1000,
      }}
      elevation={4}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={isLiveData ? 'LIVE DATA' : 'DEMO MODE'}
            color={isLiveData ? 'success' : 'warning'}
            size="small"
            variant="outlined"
            sx={{
              animation: isLiveData && loading ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
            }}
          />
          
          <RateLimitedButton
            size="small"
            onClick={handleRefresh}
            loading={loading}
            rateLimitOptions={{
              maxRequests: 10,
              windowMs: 60000 // 10 refreshes per minute
            }}
            onRateLimitReached={() => {
              // Could show a notification here
            }}
            sx={{
              minWidth: 'auto',
              p: 0.5,
              '& .MuiCircularProgress-root': {
                mr: 0
              }
            }}
          >
            <RefreshIcon sx={{
              animation: loading ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }} />
          </RateLimitedButton>
        </Box>

        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Data Sources:
          </Typography>
          
          <List dense sx={{ p: 0 }}>
            {dataSources.map((source, index) => (
              <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {getSourceIcon(source.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">
                        {source.name}
                      </Typography>
                      {getStatusIcon(source.status)}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {getTimeAgo(source.lastUpdate)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>

          {!isLiveData && (
            <Box sx={{ mt: 2, p: 1, backgroundColor: '#2a1f10', borderRadius: 1 }}>
              <Typography variant="caption" color="warning.main">
                ⚠️ Demo Mode: Using simulated data
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Add NewsAPI key to enable live data
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default DataSourceIndicator;