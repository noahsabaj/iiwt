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
  useMediaQuery,
  useTheme,
  Drawer,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Login as LoginIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  Map as MapIcon,
  Assessment as StatsIcon,
  Refresh as RefreshIcon,
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
import { useConflictData } from '../contexts/ConflictDataContext';
import { ErrorBoundary, ErrorState } from './ErrorBoundary';
import LoadingSkeleton, { DashboardCardSkeleton, MapSkeleton } from './LoadingSkeleton';
import { RealTimeHeader, ConnectionStatus } from './RealTimeIndicators';
import { MobileDrawer, CollapsibleSection, MobileBottomNav, MobileSpeedDial } from './MobileResponsive';
import ConflictIntensityMeter from './ConflictIntensityMeter';
import TimelineSlider from './TimelineSlider';
import SearchAndFilter, { FilterOptions } from './SearchAndFilter';
import { ContextualToolbar, QuickActionToolbar, createDefaultActions } from './QuickActionToolbar';
import { exportData } from '../utils/exportUtils';
import { performanceMonitor, memoryMonitor, useDebounce } from '../utils/performance';
import { ErrorHandler, ErrorFactory, showSuccess, showInfo } from '../utils/errorHandling';
import { announceToScreenReader, useReducedMotion, createSkipLink } from '../utils/accessibility';
import { apiCache } from '../utils/cache';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: conflictData, loading, error, refreshData } = useConflictData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const prefersReducedMotion = useReducedMotion();
  
  // Existing state
  const [alertCount, setAlertCount] = useState(3);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // New UI state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: { start: null, end: null },
    severity: [],
    sources: [],
    locations: [],
    types: [],
    sortBy: 'date',
    sortOrder: 'desc',
    intensityRange: [0, 100]
  });
  const [isConnected, setIsConnected] = useState(true);
  const [bookmarkedItems, setBookmarkedItems] = useState<string[]>([]);

  useEffect(() => {
    performanceMonitor.startTime('dashboard-init');
    
    // Add skip link for accessibility
    const skipLink = createSkipLink('main-content', 'Skip to conflict data');
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Monitor memory usage in development
    if (process.env.NODE_ENV === 'development') {
      memoryMonitor.logUsage('Dashboard Mount');
    }

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Check memory usage periodically
      if (process.env.NODE_ENV === 'development') {
        memoryMonitor.checkForLeaks();
      }
    }, 30000); // Update every 30 seconds

    performanceMonitor.endTime('dashboard-init');

    return () => {
      clearInterval(interval);
      performanceMonitor.clearMarks('dashboard-init');
      // Clean up skip link
      const existingSkipLink = document.querySelector('a[href="#main-content"]');
      if (existingSkipLink) {
        document.body.removeChild(existingSkipLink);
      }
    };
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

  // Enhanced UI handlers with debouncing and error handling
  const debouncedRefresh = useDebounce(() => {
    performanceMonitor.startTime('data-refresh');
    
    try {
      refreshData();
      setLastUpdate(new Date());
      announceToScreenReader('Data refreshed successfully', 'polite');
      showSuccess('Data refreshed');
      
      // Clear relevant cache entries
      apiCache.clearByTags(['conflict-data', 'timeline']);
      
      performanceMonitor.endTime('data-refresh');
    } catch (error) {
      const appError = ErrorFactory.fromError(error as Error, 'dashboard-refresh');
      ErrorHandler.handle(appError);
    }
  }, 500);

  const handleQuickAction = (actionId: string) => {
    try {
      switch (actionId) {
        case 'refresh':
          debouncedRefresh();
          break;
        case 'search':
          setShowSearchFilter(!showSearchFilter);
          announceToScreenReader(
            showSearchFilter ? 'Search panel closed' : 'Search panel opened',
            'polite'
          );
          break;
        case 'timeline':
          setShowTimeline(!showTimeline);
          announceToScreenReader(
            showTimeline ? 'Timeline view closed' : 'Timeline view opened',
            'polite'
          );
          break;
        case 'alerts':
          setAlertModalOpen(true);
          announceToScreenReader('Alert modal opened', 'polite');
          break;
        case 'share':
          if (navigator.share) {
            navigator.share({
              title: 'Israel-Iran Conflict Tracker',
              url: window.location.href
            }).then(() => {
              showSuccess('Link shared successfully');
            }).catch(() => {
              showInfo('Link copied to clipboard');
              navigator.clipboard?.writeText(window.location.href);
            });
          } else {
            navigator.clipboard?.writeText(window.location.href);
            showInfo('Link copied to clipboard');
          }
          break;
        case 'bookmark':
          // Toggle bookmark for current view
          const isBookmarked = bookmarkedItems.includes('dashboard');
          if (isBookmarked) {
            setBookmarkedItems(prev => prev.filter(item => item !== 'dashboard'));
            announceToScreenReader('Dashboard bookmark removed', 'polite');
          } else {
            setBookmarkedItems(prev => [...prev, 'dashboard']);
            announceToScreenReader('Dashboard bookmarked', 'polite');
          }
          break;
        case 'download':
          handleExportData();
          break;
        default:
          console.warn('Unknown action:', actionId);
      }
    } catch (error) {
      const appError = ErrorFactory.fromError(error as Error, 'quick-action');
      ErrorHandler.handle(appError);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Apply filters to data
  };

  const handleTimelineChange = (timestamp: Date) => {
    // Filter data based on selected time
    console.log('Timeline changed to:', timestamp);
  };

  const handleExportData = async () => {
    performanceMonitor.startTime('data-export');
    
    try {
      announceToScreenReader('Preparing data export...', 'polite');
      showInfo('Preparing export...');

      const exportDataPayload = {
        title: 'Israel-Iran Conflict Tracker',
        timestamp: new Date(),
        conflictLevel: conflictIntensityData.level,
        timeline: conflictData?.timeline || timelineEvents,
        casualties: conflictData?.casualties || { killed: 0, injured: 0 },
        facilities: conflictData?.facilities || [],
        threats: conflictData?.threatLevel || null
      };

      // Show format selection or default to PDF
      const success = await exportData(exportDataPayload, 'pdf');
      
      if (success) {
        showSuccess('Export completed successfully!');
        announceToScreenReader('Data exported successfully', 'polite');
        
        // Track successful export
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Export successful - PDF generated');
        }
      } else {
        throw new Error('Export operation failed');
      }
    } catch (error) {
      const appError = ErrorFactory.fromError(error as Error, 'data-export');
      appError.userFriendlyMessage = 'Failed to export data. Please try again.';
      appError.retry = handleExportData; // Add retry function
      
      await ErrorHandler.handle(appError);
    } finally {
      performanceMonitor.endTime('data-export');
    }
  };

  // Mock conflict intensity data
  const conflictIntensityData = {
    level: 75,
    trend: 'up' as const,
    factors: {
      newsActivity: 80,
      casualtyReports: 60,
      militaryMovements: 85,
      diplomaticActivity: 40,
      economicImpact: 70
    },
    lastUpdate: lastUpdate
  };

  // Mock timeline events
  const timelineEvents = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000),
      title: 'Military movements detected',
      severity: 'high' as const,
      type: 'military' as const,
      description: 'Satellite imagery shows increased activity'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 7200000),
      title: 'Diplomatic statement issued',
      severity: 'medium' as const,
      type: 'diplomatic' as const,
      description: 'Official response to recent developments'
    }
  ];

  const mobileNavTabs = [
    { label: 'Overview', icon: <WarningIcon /> },
    { label: 'Map', icon: <MapIcon /> },
    { label: 'Timeline', icon: <TimelineIcon /> },
    { label: 'Analytics', icon: <StatsIcon /> }
  ];

  const speedDialActions = [
    {
      icon: <RefreshIcon />,
      name: 'Refresh',
      onClick: () => handleQuickAction('refresh')
    },
    {
      icon: <SearchIcon />,
      name: 'Search',
      onClick: () => handleQuickAction('search')
    },
    {
      icon: <TimelineIcon />,
      name: 'Timeline',
      onClick: () => handleQuickAction('timeline')
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#d32f2f' }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <WarningIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ISRAEL-IRAN CONFLICT TRACKER
          </Typography>
          <ConnectionStatus isConnected={isConnected} showText={false} />
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

      {/* Mobile Drawer */}
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)}>
        <ContextualToolbar
          context="dashboard"
          onAction={handleQuickAction}
          notifications={alertCount}
        />
      </MobileDrawer>

      {/* Alert Banner */}
      <Alert severity="error" sx={{ borderRadius: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          🔴 ACTIVE CONFLICT STATUS • Last Update: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Alert>

      {/* Main Content */}
      <Container 
        component="main" 
        id="main-content"
        maxWidth="xl" 
        sx={{ mt: 2, pb: isMobile ? 10 : 4 }}
        role="main"
        aria-label="Conflict tracking dashboard"
      >
        <ErrorBoundary>
          <DemoModeNotification />
          
          {/* Quick Action Toolbar */}
          {!isMobile && (
            <QuickActionToolbar
              actions={createDefaultActions({
                onRefresh: () => handleQuickAction('refresh'),
                onSearch: () => handleQuickAction('search'),
                onShare: () => handleQuickAction('share'),
                onDownload: () => handleQuickAction('download')
              })}
              variant="toolbar"
              showLabels={false}
            />
          )}

          {/* Search and Filter */}
          {showSearchFilter && (
            <SearchAndFilter
              onFilterChange={handleFilterChange}
              availableOptions={{
                sources: ['Reuters', 'BBC', 'CNN', 'Al Jazeera'],
                locations: ['Tel Aviv', 'Tehran', 'Jerusalem', 'Isfahan', 'Natanz'],
                types: ['Breaking News', 'Military', 'Diplomatic', 'Economic']
              }}
              resultCount={conflictData?.timeline?.length || 0}
            />
          )}

          {/* Timeline Control */}
          {showTimeline && (
            <TimelineSlider
              events={timelineEvents}
              onTimeChange={handleTimelineChange}
              autoPlay={false}
              showEventMarkers={true}
            />
          )}
          {loading ? (
            <Box role="status" aria-label="Loading conflict data">
              <DashboardCardSkeleton />
            </Box>
          ) : error ? (
            <Box role="alert" aria-label="Data loading error">
              <ErrorState 
                error={error} 
                onRetry={refreshData}
                variant="card"
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Conflict Intensity Meter - New */}
              <ErrorBoundary>
                <ConflictIntensityMeter 
                  data={conflictIntensityData}
                  showDetails={!isMobile}
                  variant={isMobile ? 'compact' : 'detailed'}
                />
              </ErrorBoundary>

              {/* Top Row - Main Stats */}
              {isMobile ? (
                <CollapsibleSection 
                  title="Casualty Counter" 
                  icon={<WarningIcon />}
                  defaultExpanded={true}
                >
                  <ErrorBoundary fallback={({ error, retry }) => 
                    <ErrorState error={error} onRetry={retry} variant="inline" />
                  }>
                    <CasualtyCounter />
                  </ErrorBoundary>
                </CollapsibleSection>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
                  <ErrorBoundary>
                    <CasualtyCounter />
                  </ErrorBoundary>
                  <ErrorBoundary fallback={({ error, retry }) => 
                    <MapSkeleton />
                  }>
                    <EnhancedConflictMap />
                  </ErrorBoundary>
                </Box>
              )}

              {/* Map Section for Mobile */}
              {isMobile && (
                <CollapsibleSection 
                  title="Conflict Map" 
                  icon={<MapIcon />}
                  defaultExpanded={false}
                >
                  <ErrorBoundary fallback={({ error, retry }) => 
                    <MapSkeleton />
                  }>
                    <EnhancedConflictMap />
                  </ErrorBoundary>
                </CollapsibleSection>
              )}

              {/* Middle Row - Threat & Timeline */}
              {isMobile ? (
                <>
                  <CollapsibleSection 
                    title="Threat Level" 
                    icon={<WarningIcon />}
                    defaultExpanded={true}
                  >
                    <ErrorBoundary>
                      <ThreatLevelIndicator />
                    </ErrorBoundary>
                  </CollapsibleSection>
                  <CollapsibleSection 
                    title="Timeline" 
                    icon={<TimelineIcon />}
                    defaultExpanded={false}
                  >
                    <ErrorBoundary>
                      <ConflictTimeline />
                    </ErrorBoundary>
                  </CollapsibleSection>
                </>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
                  <ErrorBoundary>
                    <ThreatLevelIndicator />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <ConflictTimeline />
                  </ErrorBoundary>
                </Box>
              )}

              {/* Nuclear Facilities and Demands Row */}
              {isMobile ? (
                <>
                  <CollapsibleSection 
                    title="Nuclear Facilities" 
                    icon={<WarningIcon />}
                    defaultExpanded={false}
                  >
                    <ErrorBoundary>
                      <NuclearFacilitiesMonitor />
                    </ErrorBoundary>
                  </CollapsibleSection>
                  <CollapsibleSection 
                    title="Demand Tracker" 
                    icon={<StatsIcon />}
                    defaultExpanded={false}
                  >
                    <ErrorBoundary>
                      <DemandTracker />
                    </ErrorBoundary>
                  </CollapsibleSection>
                </>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
                  <ErrorBoundary>
                    <NuclearFacilitiesMonitor />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <DemandTracker />
                  </ErrorBoundary>
                </Box>
              )}

              {/* Military Operations Row */}
              {isMobile ? (
                <>
                  <CollapsibleSection 
                    title="Military Operations" 
                    icon={<WarningIcon />}
                    defaultExpanded={false}
                  >
                    <ErrorBoundary>
                      <MilitaryOperationsTracker />
                    </ErrorBoundary>
                  </CollapsibleSection>
                  <CollapsibleSection 
                    title="Weapons Tracker" 
                    icon={<WarningIcon />}
                    defaultExpanded={false}
                  >
                    <ErrorBoundary>
                      <WeaponsTracker />
                    </ErrorBoundary>
                  </CollapsibleSection>
                </>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
                  <ErrorBoundary>
                    <MilitaryOperationsTracker />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <WeaponsTracker />
                  </ErrorBoundary>
                </Box>
              )}

              {/* Economic Impact Row */}
              {isMobile ? (
                <>
                  <CollapsibleSection 
                    title="Economic Impact" 
                    icon={<StatsIcon />}
                    defaultExpanded={false}
                  >
                    <ErrorBoundary>
                      <EconomicImpactDashboard />
                    </ErrorBoundary>
                  </CollapsibleSection>
                  <CollapsibleSection 
                    title="Regional Allies" 
                    icon={<MapIcon />}
                    defaultExpanded={false}
                  >
                    <ErrorBoundary>
                      <RegionalAlliesMonitor />
                    </ErrorBoundary>
                  </CollapsibleSection>
                </>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
                  <ErrorBoundary>
                    <EconomicImpactDashboard />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <RegionalAlliesMonitor />
                  </ErrorBoundary>
                </Box>
              )}

              {/* OSINT Intelligence Row */}
              <CollapsibleSection 
                title="OSINT Intelligence" 
                icon={<StatsIcon />}
                defaultExpanded={!isMobile}
              >
                <ErrorBoundary>
                  <OSINTDashboard />
                </ErrorBoundary>
              </CollapsibleSection>

              {/* Source Code & Transparency Row */}
              <CollapsibleSection 
                title="Source Code & Transparency" 
                icon={<StatsIcon />}
                defaultExpanded={false}
              >
                <ErrorBoundary>
                  <SourceCodeViewer />
                </ErrorBoundary>
              </CollapsibleSection>
            </Box>
          )}
        </ErrorBoundary>
      </Container>

      {/* Mobile Speed Dial for Quick Actions */}
      {isMobile && (
        <MobileSpeedDial actions={speedDialActions} />
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          tabs={mobileNavTabs}
        />
      )}

      {/* Floating Action Button for Alerts (Desktop only) */}
      {!isMobile && (
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
      )}

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