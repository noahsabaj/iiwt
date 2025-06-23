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
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Login as LoginIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import CasualtyCounter from './CasualtyCounter';
import NuclearFacilitiesMonitor from './NuclearFacilitiesMonitor';
import LiveClock from './LiveClock';
import ConflictTimeline from './ConflictTimeline';
import ThreatLevelIndicator from './ThreatLevelIndicator';
import AlertModal from './AlertModal';
import DemandTracker from './DemandTracker';
import EnhancedConflictMap from './EnhancedConflictMap';
import DataSourceIndicator from './DataSourceIndicator';
import MilitaryOperationsTracker from './MilitaryOperationsTracker';
import WeaponsTracker from './WeaponsTracker';
import EconomicImpactDashboard from './EconomicImpactDashboard';
import RegionalAlliesMonitor from './RegionalAlliesMonitor';
import SourceCodeViewer from './SourceCodeViewer';
import OSINTDashboard from './OSINTDashboard';
import DemoModeNotification from './DemoModeNotification';
import LoginDialog from './LoginDialog';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [alertCount, setAlertCount] = useState(3);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const conflictStartDate = new Date('2025-06-13T00:00:00Z');
  const daysSinceStart = Math.floor((Date.now() - conflictStartDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

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
          
          {/* Auth Section */}
          <Box sx={{ ml: 2 }}>
            {isAuthenticated && user ? (
              <>
                <IconButton
                  onClick={handleUserMenuOpen}
                  color="inherit"
                  sx={{ p: 0.5 }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                    {user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem disabled>
                    <Typography variant="caption">
                      {user.email}
                    </Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={() => setLoginDialogOpen(true)}
                size="small"
              >
                Login
              </Button>
            )}
          </Box>
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
        <DemoModeNotification />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Top Row - Main Stats */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            <CasualtyCounter />
            <EnhancedConflictMap />
          </Box>

          {/* Middle Row - Threat & Timeline */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
            <ThreatLevelIndicator />
            <ConflictTimeline />
          </Box>

          {/* Nuclear Facilities and Demands Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            <NuclearFacilitiesMonitor />
            <DemandTracker />
          </Box>

          {/* Military Operations Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            <MilitaryOperationsTracker />
            <WeaponsTracker />
          </Box>

          {/* Economic Impact Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
            <EconomicImpactDashboard />
            <RegionalAlliesMonitor />
          </Box>

          {/* OSINT Intelligence Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
            <OSINTDashboard />
          </Box>

          {/* Source Code & Transparency Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
            <SourceCodeViewer />
          </Box>
        </Box>
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

      {/* Data Source Indicator */}
      <DataSourceIndicator />
      
      {/* Login Dialog */}
      <LoginDialog 
        open={loginDialogOpen} 
        onClose={() => setLoginDialogOpen(false)} 
      />
    </Box>
  );
};

export default Dashboard;