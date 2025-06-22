import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Box,
  Chip,
  Alert,
  Fab,
  Badge,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import CasualtyCounter from './CasualtyCounter';
import NuclearFacilitiesMonitor from './NuclearFacilitiesMonitor';
import LiveClock from './LiveClock';
import ConflictTimeline from './ConflictTimeline';
import ThreatLevelIndicator from './ThreatLevelIndicator';
import AlertModal from './AlertModal';
import DemandTracker from './DemandTracker';

const Dashboard: React.FC = () => {
  const [alertCount, setAlertCount] = useState(3);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const conflictStartDate = new Date('2025-06-13T00:00:00Z');
  const daysSinceStart = Math.floor((Date.now() - conflictStartDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#d32f2f' }}>
        <Toolbar>
          <WarningIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ISRAEL-IRAN CONFLICT TRACKER
          </Typography>
          <Chip
            icon={<ScheduleIcon />}
            label={`DAY ${daysSinceStart + 1}`}
            color="warning"
            variant="outlined"
            sx={{ mr: 2, fontWeight: 600 }}
          />
          <LiveClock />
        </Toolbar>
      </AppBar>

      {/* Alert Banner */}
      <Alert severity="error" sx={{ borderRadius: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          🔴 ACTIVE CONFLICT STATUS • Last Update: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Alert>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 2, pb: 4 }}>
        <Grid container spacing={3}>
          {/* Casualty Statistics */}
          <Grid item xs={12} lg={6}>
            <CasualtyCounter />
          </Grid>

          {/* Nuclear Facilities Status */}
          <Grid item xs={12} lg={6}>
            <NuclearFacilitiesMonitor />
          </Grid>

          {/* Threat Level Indicator */}
          <Grid item xs={12} md={6} lg={4}>
            <ThreatLevelIndicator />
          </Grid>

          {/* Timeline */}
          <Grid item xs={12} md={6} lg={8}>
            <ConflictTimeline />
          </Grid>

          {/* Demand Tracker */}
          <Grid item xs={12}>
            <DemandTracker />
          </Grid>
        </Grid>
      </Container>

      {/* Floating Action Button for Alerts */}
      <Fab
        color="error"
        aria-label="alerts"
        onClick={() => setAlertModalOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.7)',
            },
            '70%': {
              boxShadow: '0 0 0 10px rgba(211, 47, 47, 0)',
            },
            '100%': {
              boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)',
            },
          },
        }}
      >
        <Badge badgeContent={alertCount} color="warning">
          <NotificationsIcon />
        </Badge>
      </Fab>

      {/* Alert Modal */}
      <AlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        alertCount={alertCount}
        onAlertCountChange={setAlertCount}
      />
    </Box>
  );
};

export default Dashboard;