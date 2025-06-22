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
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';
import { Alert } from '../types';
import { SEVERITY_COLORS } from '../constants';
import EventConfidenceIndicator from './EventConfidenceIndicator';

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  alertCount: number;
  onAlertCountChange: (count: number) => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ open, onClose, alertCount, onAlertCountChange }) => {
  const { data: conflictData } = useConflictData();
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [previousAlertCount, setPreviousAlertCount] = useState(0);

  // Sync alerts from context
  useEffect(() => {
    if (conflictData && conflictData.alerts) {
      setLocalAlerts(conflictData.alerts);
      
      // Play sound for new alerts
      const currentAlertCount = conflictData.alerts.filter((a: Alert) => !a.read).length;
      if (soundEnabled && currentAlertCount > previousAlertCount) {
        console.log('🔊 New alert sound');
      }
      setPreviousAlertCount(currentAlertCount);
    }
  }, [conflictData, soundEnabled, previousAlertCount]);

  // Update unread count
  useEffect(() => {
    const unreadCount = localAlerts.filter(alert => !alert.read).length;
    onAlertCountChange(unreadCount);
  }, [localAlerts, onAlertCountChange]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon sx={{ color: SEVERITY_COLORS.critical }} />;
      case 'high': return <WarningIcon sx={{ color: SEVERITY_COLORS.high }} />;
      case 'medium': return <WarningIcon sx={{ color: SEVERITY_COLORS.medium }} />;
      case 'low': return <InfoIcon sx={{ color: SEVERITY_COLORS.low }} />;
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
    setLocalAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const markAllAsRead = () => {
    setLocalAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const getTimeAgo = (timestamp: Date | string): string => {
    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getAlertTypeLabel = (type: string): string => {
    switch (type) {
      case 'missile': return '🚀 MISSILE';
      case 'strike': return '💥 STRIKE';
      case 'casualty': return '🚑 CASUALTY';
      case 'diplomatic': return '🤝 DIPLOMATIC';
      case 'nuclear': return '☢️ NUCLEAR';
      default: return type.toUpperCase();
    }
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
        <Badge badgeContent={localAlerts.filter((a: Alert) => !a.read).length} color="error">
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
          disabled={localAlerts.filter((a: Alert) => !a.read).length === 0}
        >
          Mark All Read
        </Button>
        
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, maxHeight: '500px' }}>
        {localAlerts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <NotificationsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1">
              No alerts at this time
            </Typography>
            <Typography variant="caption">
              Alerts will appear here as they are detected from news sources
            </Typography>
          </Box>
        ) : (
          <List>
            {localAlerts.map((alert, index) => (
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: alert.read ? 400 : 600,
                            opacity: alert.read ? 0.7 : 1,
                            flex: 1,
                          }}
                        >
                          {alert.title}
                        </Typography>
                        <Chip
                          label={getAlertTypeLabel(alert.type)}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
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
                          sx={{ opacity: alert.read ? 0.6 : 0.9, mt: 0.5 }}
                        >
                          {alert.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TimeIcon sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {getTimeAgo(alert.timestamp)}
                            </Typography>
                          </Box>
                          {alert.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {alert.location}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        
                        {/* Confidence Indicator for alerts derived from news */}
                        {(alert as any).metadata && (
                          <Box sx={{ mt: 1 }}>
                            <EventConfidenceIndicator
                              confidence={(alert as any).metadata.confidence || 0.7}
                              sources={(alert as any).metadata.sources || [(alert as any).source || 'Breaking News']}
                              verified={(alert as any).metadata.verified || false}
                            />
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < localAlerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;