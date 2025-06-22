import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge,
  Divider,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

interface Alert {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'missile' | 'strike' | 'casualty' | 'diplomatic' | 'nuclear';
  read: boolean;
}

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  alertCount: number;
  onAlertCountChange: (count: number) => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ open, onClose, alertCount, onAlertCountChange }) => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      title: 'INCOMING MISSILE ALERT',
      description: 'Multiple missiles detected over Mediterranean Sea heading towards Israeli airspace',
      severity: 'critical',
      type: 'missile',
      read: false,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      title: 'Hospital Strike Confirmed',
      description: 'Direct hit on medical facility in southern Israel - emergency response activated',
      severity: 'critical',
      type: 'strike',
      read: false,
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      title: 'Radiation Levels Monitored',
      description: 'Increased monitoring at Natanz facility following contamination warnings',
      severity: 'high',
      type: 'nuclear',
      read: true,
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      title: 'Diplomatic Communication',
      description: 'Iran signals readiness for nuclear talks when Israeli aggression stops',
      severity: 'medium',
      type: 'diplomatic',
      read: true,
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      title: 'Casualty Report Update',
      description: '15 additional injured reported from latest missile strikes on Tel Aviv',
      severity: 'high',
      type: 'casualty',
      read: true,
    },
  ]);

  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const unreadCount = alerts.filter(alert => !alert.read).length;
    onAlertCountChange(unreadCount);
  }, [alerts, onAlertCountChange]);

  // Simulate new alerts
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        const newAlert: Alert = {
          id: Date.now().toString(),
          timestamp: new Date(),
          title: getRandomAlertTitle(),
          description: getRandomAlertDescription(),
          severity: getRandomSeverity(),
          type: getRandomType(),
          read: false,
        };

        setAlerts(prev => [newAlert, ...prev]);

        if (soundEnabled) {
          // Play notification sound (would need actual audio file)
          console.log('🔊 Alert sound played');
        }
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [open, soundEnabled]);

  const getRandomAlertTitle = (): string => {
    const titles = [
      'MISSILE LAUNCH DETECTED',
      'AIRSPACE VIOLATION',
      'FACILITY UNDER ATTACK',
      'EVACUATION ORDER',
      'DIPLOMATIC BREAKTHROUGH',
      'CASUALTY REPORT',
      'NUCLEAR SAFETY ALERT',
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  };

  const getRandomAlertDescription = (): string => {
    const descriptions = [
      'New missile activity detected in conflict zone',
      'Emergency services responding to incident',
      'International monitoring agencies alerted',
      'Civilian population advised to take shelter',
      'Military command centers coordinating response',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const getRandomSeverity = (): Alert['severity'] => {
    const severities: Alert['severity'][] = ['critical', 'high', 'medium', 'low'];
    return severities[Math.floor(Math.random() * severities.length)];
  };

  const getRandomType = (): Alert['type'] => {
    const types: Alert['type'][] = ['missile', 'strike', 'casualty', 'diplomatic', 'nuclear'];
    return types[Math.floor(Math.random() * types.length)];
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon sx={{ color: '#d32f2f' }} />;
      case 'high': return <WarningIcon sx={{ color: '#ff5722' }} />;
      case 'medium': return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'low': return <InfoIcon sx={{ color: '#2196f3' }} />;
      default: return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' => {
    switch (severity) {
      case 'critical':
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
        <Badge badgeContent={alerts.filter(a => !a.read).length} color="error">
          <NotificationsIcon sx={{ mr: 2, color: '#ff5722' }} />
        </Badge>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          LIVE ALERTS
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              size="small"
            />
          }
          label={soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          sx={{ mr: 1 }}
        />
        
        <Button
          onClick={markAllAsRead}
          size="small"
          color="warning"
          sx={{ mr: 1 }}
        >
          Mark All Read
        </Button>
        
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, maxHeight: '500px' }}>
        <List>
          {alerts.map((alert, index) => (
            <React.Fragment key={alert.id}>
              <ListItem
                onClick={() => markAsRead(alert.id)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: alert.read ? 'transparent' : 'rgba(211, 47, 47, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon>
                  {getSeverityIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: alert.read ? 400 : 600,
                          opacity: alert.read ? 0.7 : 1,
                        }}
                      >
                        {alert.title}
                      </Typography>
                      <Chip
                        label={alert.severity.toUpperCase()}
                        color={getSeverityColor(alert.severity)}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      {!alert.read && (
                        <Chip
                          label="NEW"
                          color="error"
                          size="small"
                          sx={{ fontSize: '0.6rem', height: 18 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ opacity: alert.read ? 0.6 : 0.9 }}
                      >
                        {alert.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <TimeIcon sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {getTimeAgo(alert.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < alerts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;