import React, { useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Button,
  Chip,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Zoom,
  alpha
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  Assessment as StatsIcon,
  Settings as SettingsIcon,
  NotificationsActive as AlertIcon,
  Print as PrintIcon,
  Screenshot as ScreenshotIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Home as HomeIcon,
  Help as HelpIcon
} from '@mui/icons-material';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  disabled?: boolean;
  badge?: number | string;
  tooltip?: string;
}

interface QuickActionToolbarProps {
  actions: QuickAction[];
  variant?: 'toolbar' | 'floating' | 'compact';
  position?: 'top' | 'bottom' | 'left' | 'right';
  autoHide?: boolean;
  showLabels?: boolean;
}

export const QuickActionToolbar: React.FC<QuickActionToolbarProps> = ({
  actions,
  variant = 'toolbar',
  position = 'top',
  autoHide = false,
  showLabels = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isVisible, setIsVisible] = useState(!autoHide);

  const renderAction = (action: QuickAction, index: number) => {
    const button = (
      <Tooltip title={action.tooltip || action.label} key={action.id}>
        <span>
          <IconButton
            onClick={action.onClick}
            disabled={action.disabled}
            color={action.color || 'primary'}
            sx={{
              position: 'relative',
              '&:hover': {
                backgroundColor: alpha(theme.palette[action.color || 'primary'].main, 0.1)
              }
            }}
          >
            {action.icon}
            {action.badge && (
              <Chip
                label={action.badge}
                size="small"
                color={action.color || 'primary'}
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  height: 16,
                  fontSize: '0.6rem',
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
              />
            )}
          </IconButton>
        </span>
      </Tooltip>
    );

    if (variant === 'compact' || !showLabels) {
      return button;
    }

    return (
      <Box key={action.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        {button}
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {action.label}
        </Typography>
      </Box>
    );
  };

  if (variant === 'floating' && isMobile) {
    return (
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        icon={<SpeedDialIcon />}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.id}
            icon={action.icon}
            tooltipTitle={action.label}
            onClick={action.onClick}
            FabProps={{
              disabled: action.disabled,
              color: action.color || 'primary'
            }}
          />
        ))}
      </SpeedDial>
    );
  }

  const getToolbarStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
      transition: 'all 0.3s ease',
      transform: isVisible ? 'translateY(0)' : 
        position === 'top' ? 'translateY(-100%)' : 'translateY(100%)'
    };

    switch (position) {
      case 'top':
        return { ...baseStyles, top: 0, left: 0, right: 0 };
      case 'bottom':
        return { ...baseStyles, bottom: 0, left: 0, right: 0 };
      case 'left':
        return { 
          ...baseStyles, 
          left: 0, 
          top: '50%', 
          transform: isVisible ? 'translateY(-50%)' : 'translateX(-100%) translateY(-50%)'
        };
      case 'right':
        return { 
          ...baseStyles, 
          right: 0, 
          top: '50%', 
          transform: isVisible ? 'translateY(-50%)' : 'translateX(100%) translateY(-50%)'
        };
      default:
        return baseStyles;
    }
  };

  if (variant === 'floating') {
    return (
      <Paper
        elevation={6}
        sx={{
          ...getToolbarStyles(),
          p: 1,
          m: 1,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: position === 'left' || position === 'right' ? 'column' : 'row',
            alignItems: 'center'
          }}
        >
          {actions.map(renderAction)}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        mb: 2,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.95)
      }}
      onMouseEnter={() => autoHide && setIsVisible(true)}
      onMouseLeave={() => autoHide && setIsVisible(false)}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: isMobile ? 'space-around' : 'flex-start'
        }}
      >
        {actions.map((action, index) => (
          <React.Fragment key={action.id}>
            {renderAction(action, index)}
            {index < actions.length - 1 && index % 4 === 3 && (
              <Divider orientation="vertical" flexItem />
            )}
          </React.Fragment>
        ))}
      </Box>
    </Paper>
  );
};

// Predefined action sets for common use cases
export const createDefaultActions = (handlers: {
  onRefresh?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onFullscreen?: () => void;
  onSettings?: () => void;
}) => {
  const actions: QuickAction[] = [];

  if (handlers.onRefresh) {
    actions.push({
      id: 'refresh',
      label: 'Refresh',
      icon: <RefreshIcon />,
      onClick: handlers.onRefresh,
      color: 'primary',
      tooltip: 'Refresh all data'
    });
  }

  if (handlers.onSearch) {
    actions.push({
      id: 'search',
      label: 'Search',
      icon: <SearchIcon />,
      onClick: handlers.onSearch,
      color: 'primary',
      tooltip: 'Search articles and events'
    });
  }

  if (handlers.onFilter) {
    actions.push({
      id: 'filter',
      label: 'Filter',
      icon: <FilterIcon />,
      onClick: handlers.onFilter,
      color: 'primary',
      tooltip: 'Filter and sort data'
    });
  }

  if (handlers.onBookmark) {
    actions.push({
      id: 'bookmark',
      label: 'Bookmark',
      icon: <BookmarkBorderIcon />,
      onClick: handlers.onBookmark,
      color: 'secondary',
      tooltip: 'Bookmark this view'
    });
  }

  if (handlers.onShare) {
    actions.push({
      id: 'share',
      label: 'Share',
      icon: <ShareIcon />,
      onClick: handlers.onShare,
      color: 'secondary',
      tooltip: 'Share current view'
    });
  }

  if (handlers.onDownload) {
    actions.push({
      id: 'download',
      label: 'Export',
      icon: <DownloadIcon />,
      onClick: handlers.onDownload,
      color: 'info',
      tooltip: 'Export data as PDF/CSV'
    });
  }

  if (handlers.onFullscreen) {
    actions.push({
      id: 'fullscreen',
      label: 'Fullscreen',
      icon: <FullscreenIcon />,
      onClick: handlers.onFullscreen,
      color: 'info',
      tooltip: 'Toggle fullscreen mode'
    });
  }

  if (handlers.onSettings) {
    actions.push({
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      onClick: handlers.onSettings,
      color: 'secondary',
      tooltip: 'Open settings'
    });
  }

  return actions;
};

export const createMapActions = (handlers: {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onToggleLayer?: () => void;
  onScreenshot?: () => void;
}) => {
  const actions: QuickAction[] = [];

  if (handlers.onZoomIn) {
    actions.push({
      id: 'zoom-in',
      label: 'Zoom In',
      icon: <ZoomInIcon />,
      onClick: handlers.onZoomIn,
      color: 'primary'
    });
  }

  if (handlers.onZoomOut) {
    actions.push({
      id: 'zoom-out',
      label: 'Zoom Out',
      icon: <ZoomOutIcon />,
      onClick: handlers.onZoomOut,
      color: 'primary'
    });
  }

  if (handlers.onResetView) {
    actions.push({
      id: 'reset-view',
      label: 'Reset',
      icon: <HomeIcon />,
      onClick: handlers.onResetView,
      color: 'secondary'
    });
  }

  if (handlers.onScreenshot) {
    actions.push({
      id: 'screenshot',
      label: 'Screenshot',
      icon: <ScreenshotIcon />,
      onClick: handlers.onScreenshot,
      color: 'info'
    });
  }

  return actions;
};

// Context-aware action toolbar
interface ContextualToolbarProps {
  context: 'dashboard' | 'map' | 'news' | 'analytics';
  onAction: (actionId: string) => void;
  notifications?: number;
  bookmarked?: boolean;
}

export const ContextualToolbar: React.FC<ContextualToolbarProps> = ({
  context,
  onAction,
  notifications = 0,
  bookmarked = false
}) => {
  const getContextActions = (): QuickAction[] => {
    const baseActions = createDefaultActions({
      onRefresh: () => onAction('refresh'),
      onSearch: () => onAction('search'),
      onFilter: () => onAction('filter'),
      onShare: () => onAction('share'),
      onDownload: () => onAction('download')
    });

    const contextSpecific: QuickAction[] = [];

    switch (context) {
      case 'dashboard':
        contextSpecific.push(
          {
            id: 'alerts',
            label: 'Alerts',
            icon: <AlertIcon />,
            onClick: () => onAction('alerts'),
            color: 'warning',
            badge: notifications > 0 ? notifications : undefined,
            tooltip: `${notifications} active alerts`
          },
          {
            id: 'timeline',
            label: 'Timeline',
            icon: <TimelineIcon />,
            onClick: () => onAction('timeline'),
            color: 'info'
          }
        );
        break;

      case 'map':
        contextSpecific.push(...createMapActions({
          onZoomIn: () => onAction('zoom-in'),
          onZoomOut: () => onAction('zoom-out'),
          onResetView: () => onAction('reset-view'),
          onScreenshot: () => onAction('screenshot')
        }));
        break;

      case 'news':
        contextSpecific.push(
          {
            id: 'bookmark',
            label: bookmarked ? 'Bookmarked' : 'Bookmark',
            icon: bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />,
            onClick: () => onAction('bookmark'),
            color: bookmarked ? 'secondary' : 'primary'
          }
        );
        break;

      case 'analytics':
        contextSpecific.push(
          {
            id: 'stats',
            label: 'Statistics',
            icon: <StatsIcon />,
            onClick: () => onAction('stats'),
            color: 'info'
          },
          {
            id: 'print',
            label: 'Print',
            icon: <PrintIcon />,
            onClick: () => onAction('print'),
            color: 'secondary'
          }
        );
        break;
    }

    return [...baseActions, ...contextSpecific];
  };

  return (
    <QuickActionToolbar
      actions={getContextActions()}
      variant="toolbar"
      showLabels={false}
    />
  );
};

export default QuickActionToolbar;