import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Flag as FlagIcon,
  HandshakeRounded as HandshakeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';

const DemandTracker: React.FC = () => {
  const { data, loading } = useConflictData();

  if (loading || !data) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading demand tracker...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getDiplomaticStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'stalled': return 'warning';
      case 'suspended': return 'error';
      case 'none': return 'default';
      default: return 'default';
    }
  };

  const getDiplomaticStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckIcon sx={{ color: '#4caf50' }} />;
      case 'stalled': return <ScheduleIcon sx={{ color: '#ff9800' }} />;
      case 'suspended': return <CancelIcon sx={{ color: '#f44336' }} />;
      case 'none': return <WarningIcon sx={{ color: '#9e9e9e' }} />;
      default: return <WarningIcon />;
    }
  };

  const demands = data.demands;

  if (!demands) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No demand data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <GavelIcon sx={{ mr: 1, color: '#ff9800' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            PEACE DEMANDS & CONDITIONS
          </Typography>
          <Chip
            icon={getDiplomaticStatusIcon(demands.diplomaticStatus)}
            label={demands.diplomaticStatus.toUpperCase()}
            color={getDiplomaticStatusColor(demands.diplomaticStatus)}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Diplomatic Status Alert */}
        <Alert
          severity={demands.diplomaticStatus === 'suspended' ? 'error' : 'warning'}
          sx={{ mb: 3, fontSize: '0.875rem' }}
          icon={<HandshakeIcon />}
        >
          Diplomatic talks currently {demands.diplomaticStatus} - no active peace negotiations
        </Alert>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Israeli Demands */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ mr: 1 }}>
                🇮🇱
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Israeli Demands
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1, color: '#ff5722' }}>
              Primary Conditions:
            </Typography>
            <List dense sx={{ mb: 2 }}>
              {demands.israel.demands.map((demand: string, index: number) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FlagIcon sx={{ fontSize: 16, color: '#ff5722' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {demand}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" sx={{ mb: 1, color: '#d32f2f' }}>
              Red Lines:
            </Typography>
            <List dense>
              {demands.israel.redLines.map((redLine: string, index: number) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <WarningIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {redLine}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {demands.israel.lastUpdate}
            </Typography>
          </Box>

          {/* Iranian Demands */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ mr: 1 }}>
                🇮🇷
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Iranian Demands
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1, color: '#ff5722' }}>
              Primary Conditions:
            </Typography>
            <List dense sx={{ mb: 2 }}>
              {demands.iran.demands.map((demand: string, index: number) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FlagIcon sx={{ fontSize: 16, color: '#ff5722' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {demand}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" sx={{ mb: 1, color: '#d32f2f' }}>
              Red Lines:
            </Typography>
            <List dense>
              {demands.iran.redLines.map((redLine: string, index: number) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <WarningIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {redLine}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {demands.iran.lastUpdate}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Peace Process Status */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            PEACE PROCESS COMPATIBILITY
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Chip
              label="MAJOR GAPS"
              color="error"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary">
              Fundamental disagreements on nuclear program and regional presence
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={15} // Low compatibility percentage
            color="error"
            sx={{ 
              mt: 2, 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#333'
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            15% demand compatibility - significant mediation required
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DemandTracker;