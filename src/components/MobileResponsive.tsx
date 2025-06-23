import React, { useState, useRef } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Collapse,
  Card,
  CardContent,
  CardActions,
  Button,
  SwipeableDrawer,
  useTheme,
  useMediaQuery,
  Chip,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Map as MapIcon,
  Article as NewsIcon,
  Assessment as StatsIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Home as HomeIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ 
  open, 
  onClose, 
  children 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      sx={{
        '& .MuiDrawer-paper': {
          width: '80vw',
          maxWidth: 300,
          pt: 2
        }
      }}
    >
      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Menu</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {children}
      </Box>
    </SwipeableDrawer>
  );
};

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  icon,
  badge
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Card sx={{ mb: 2 }}>
      <CardActions 
        sx={{ 
          cursor: 'pointer',
          minHeight: isMobile ? 56 : 48,
          px: 2
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ flex: 1 }}>
            {title}
          </Typography>
          {badge && (
            <Chip 
              label={badge} 
              size="small" 
              color="primary"
            />
          )}
        </Box>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </CardActions>
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          {children}
        </CardContent>
      </Collapse>
    </Card>
  );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { label: string; icon: React.ReactNode; color?: string };
  rightAction?: { label: string; icon: React.ReactNode; color?: string };
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction
}) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const [swiping, setSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!startX || !currentX) return;
    
    const diff = startX - currentX;
    const threshold = 100;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (diff < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    setStartX(null);
    setCurrentX(null);
    setSwiping(false);
  };

  const swipeOffset = swiping && startX && currentX ? currentX - startX : 0;

  return (
    <Box
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'relative',
        transform: swiping ? `translateX(${swipeOffset}px)` : 'none',
        transition: swiping ? 'none' : 'transform 0.2s ease',
        overflow: 'hidden'
      }}
    >
      {/* Left action indicator */}
      {leftAction && swipeOffset > 50 && (
        <Box
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: leftAction.color || 'primary.main',
            zIndex: 1
          }}
        >
          {leftAction.icon}
          <Typography variant="caption">{leftAction.label}</Typography>
        </Box>
      )}

      {/* Right action indicator */}
      {rightAction && swipeOffset < -50 && (
        <Box
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: rightAction.color || 'primary.main',
            zIndex: 1
          }}
        >
          {rightAction.icon}
          <Typography variant="caption">{rightAction.label}</Typography>
        </Box>
      )}

      {children}
    </Box>
  );
};

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: string | number;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  height = '70vh'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      sx={{
        '& .MuiDrawer-paper': {
          height,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'visible'
        }
      }}
    >
      {/* Drag handle */}
      <Box
        sx={{
          width: 40,
          height: 4,
          bgcolor: 'grey.300',
          borderRadius: 2,
          mx: 'auto',
          mt: 1,
          mb: 2
        }}
      />
      
      {title && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      
      <Box sx={{ px: 2, flex: 1, overflow: 'auto' }}>
        {children}
      </Box>
    </SwipeableDrawer>
  );
};

interface MobileSpeedDialProps {
  actions: Array<{
    icon: React.ReactNode;
    name: string;
    onClick: () => void;
  }>;
}

export const MobileSpeedDial: React.FC<MobileSpeedDialProps> = ({ actions }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  return (
    <SpeedDial
      ariaLabel="Quick actions"
      sx={{ 
        position: 'fixed', 
        bottom: 80, 
        right: 16,
        '& .MuiFab-primary': {
          width: 56,
          height: 56
        }
      }}
      icon={<SpeedDialIcon />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => {
            action.onClick();
            setOpen(false);
          }}
        />
      ))}
    </SpeedDial>
  );
};

interface MobileBottomNavProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabs: Array<{
    label: string;
    icon: React.ReactNode;
  }>;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  value,
  onChange,
  tabs
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  return (
    <BottomNavigation
      value={value}
      onChange={onChange}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      {tabs.map((tab, index) => (
        <BottomNavigationAction
          key={index}
          label={tab.label}
          icon={tab.icon}
        />
      ))}
    </BottomNavigation>
  );
};

interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  variant?: 'text' | 'outlined' | 'contained';
  fullWidth?: boolean;
  disabled?: boolean;
}

export const TouchFriendlyButton: React.FC<TouchFriendlyButtonProps> = ({
  children,
  onClick,
  color = 'primary',
  variant = 'contained',
  fullWidth = false,
  disabled = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Button
      onClick={onClick}
      color={color}
      variant={variant}
      fullWidth={fullWidth}
      disabled={disabled}
      sx={{
        minHeight: isMobile ? 48 : 36,
        fontSize: isMobile ? '1rem' : '0.875rem',
        px: isMobile ? 3 : 2,
        borderRadius: 2
      }}
    >
      {children}
    </Button>
  );
};

export default {
  MobileDrawer,
  CollapsibleSection,
  SwipeableCard,
  MobileBottomSheet,
  MobileSpeedDial,
  MobileBottomNav,
  TouchFriendlyButton
};