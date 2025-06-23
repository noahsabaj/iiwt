import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  Badge,
  IconButton,
  Zoom,
  Fade
} from '@mui/material';
import {
  Circle as CircleIcon,
  WifiOff as OfflineIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as OnlineIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

// Pulse animation for live indicators
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

interface ConnectionStatusProps {
  isConnected: boolean;
  showText?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  showText = true 
}) => {
  return (
    <Tooltip title={isConnected ? 'Connected to server' : 'Disconnected from server'}>
      <Chip
        icon={isConnected ? <OnlineIcon /> : <OfflineIcon />}
        label={showText ? (isConnected ? 'ONLINE' : 'OFFLINE') : ''}
        color={isConnected ? 'success' : 'error'}
        variant="outlined"
        size="small"
        sx={{
          animation: isConnected ? `${pulse} 2s infinite` : 'none',
          '& .MuiChip-icon': {
            fontSize: '1rem'
          }
        }}
      />
    </Tooltip>
  );
};

interface LastUpdatedProps {
  timestamp: Date;
  label?: string;
  showIcon?: boolean;
}

export const LastUpdated: React.FC<LastUpdatedProps> = ({ 
  timestamp, 
  label = 'Last updated',
  showIcon = true 
}) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else if (minutes < 60) {
        setTimeAgo(`${minutes}m ago`);
      } else if (hours < 24) {
        setTimeAgo(`${hours}h ago`);
      } else {
        setTimeAgo(timestamp.toLocaleDateString());
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const getColor = () => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = diff / (1000 * 60);
    
    if (minutes < 5) return 'success';
    if (minutes < 15) return 'warning';
    return 'error';
  };

  return (
    <Tooltip title={`${label}: ${timestamp.toLocaleString()}`}>
      <Chip
        icon={showIcon ? <ScheduleIcon /> : undefined}
        label={timeAgo}
        color={getColor()}
        variant="outlined"
        size="small"
      />
    </Tooltip>
  );
};

interface LiveBadgeProps {
  isLive: boolean;
  children: React.ReactNode;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ isLive, children }) => {
  return (
    <Badge
      badgeContent={
        isLive ? (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#44b700',
              animation: `${pulse} 1.5s infinite`,
            }}
          />
        ) : null
      }
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      {children}
    </Badge>
  );
};

interface DataFreshnessProps {
  lastUpdate: Date;
  updateInterval?: number; // in minutes
  warningThreshold?: number; // in minutes
}

export const DataFreshness: React.FC<DataFreshnessProps> = ({
  lastUpdate,
  updateInterval = 5,
  warningThreshold = 15
}) => {
  const [status, setStatus] = useState<'fresh' | 'stale' | 'outdated'>('fresh');

  useEffect(() => {
    const checkFreshness = () => {
      const diff = (Date.now() - lastUpdate.getTime()) / (1000 * 60); // minutes
      
      if (diff <= updateInterval) {
        setStatus('fresh');
      } else if (diff <= warningThreshold) {
        setStatus('stale');
      } else {
        setStatus('outdated');
      }
    };

    checkFreshness();
    const interval = setInterval(checkFreshness, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [lastUpdate, updateInterval, warningThreshold]);

  const getStatusConfig = () => {
    switch (status) {
      case 'fresh':
        return {
          color: 'success' as const,
          icon: <CircleIcon sx={{ fontSize: 8, color: '#44b700' }} />,
          text: 'Live',
          animation: `${pulse} 2s infinite`
        };
      case 'stale':
        return {
          color: 'warning' as const,
          icon: <CircleIcon sx={{ fontSize: 8, color: '#ff9800' }} />,
          text: 'Updating',
          animation: 'none'
        };
      case 'outdated':
        return {
          color: 'error' as const,
          icon: <WarningIcon sx={{ fontSize: 12 }} />,
          text: 'Outdated',
          animation: 'none'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ animation: statusConfig.animation }}>
        {statusConfig.icon}
      </Box>
      <Typography 
        variant="caption" 
        color={statusConfig.color}
        sx={{ fontWeight: 500 }}
      >
        {statusConfig.text}
      </Typography>
    </Box>
  );
};

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  lastUpdate?: Date;
  disabled?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
  lastUpdate,
  disabled = false
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRefresh = () => {
    if (!disabled && !isLoading) {
      onRefresh();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  return (
    <Tooltip 
      title={
        lastUpdate 
          ? `Last updated: ${lastUpdate.toLocaleTimeString()}` 
          : 'Refresh data'
      }
    >
      <IconButton
        onClick={handleRefresh}
        disabled={disabled || isLoading}
        color={showSuccess ? 'success' : 'primary'}
        sx={{
          animation: isLoading ? 'spin 1s linear infinite' : 'none',
          '@keyframes spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }}
      >
        <RefreshIcon />
      </IconButton>
    </Tooltip>
  );
};

interface RealTimeHeaderProps {
  title: string;
  lastUpdate: Date;
  isConnected: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  showLiveBadge?: boolean;
}

export const RealTimeHeader: React.FC<RealTimeHeaderProps> = ({
  title,
  lastUpdate,
  isConnected,
  isLoading = false,
  onRefresh,
  showLiveBadge = true
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mb: 2 
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showLiveBadge ? (
          <LiveBadge isLive={isConnected && !isLoading}>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          </LiveBadge>
        ) : (
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        )}
        <DataFreshness lastUpdate={lastUpdate} />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LastUpdated timestamp={lastUpdate} />
        <ConnectionStatus isConnected={isConnected} showText={false} />
        {onRefresh && (
          <RefreshButton 
            onRefresh={onRefresh} 
            isLoading={isLoading}
            lastUpdate={lastUpdate}
          />
        )}
      </Box>
    </Box>
  );
};

export default RealTimeHeader;