import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

interface ConflictIntensityData {
  level: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  factors: {
    newsActivity: number;
    casualtyReports: number;
    militaryMovements: number;
    diplomaticActivity: number;
    economicImpact: number;
  };
  lastUpdate: Date;
}

interface ConflictIntensityMeterProps {
  data: ConflictIntensityData;
  showDetails?: boolean;
  variant?: 'compact' | 'detailed';
}

export const ConflictIntensityMeter: React.FC<ConflictIntensityMeterProps> = ({
  data,
  showDetails = true,
  variant = 'detailed'
}) => {
  const theme = useTheme();
  const [animatedLevel, setAnimatedLevel] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedLevel(data.level);
    }, 300);
    return () => clearTimeout(timer);
  }, [data.level]);

  const getIntensityConfig = (level: number) => {
    if (level >= 80) {
      return {
        label: 'CRITICAL',
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
        icon: <ErrorIcon />,
        description: 'Severe escalation with high risk of major conflict'
      };
    } else if (level >= 60) {
      return {
        label: 'HIGH',
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        icon: <WarningIcon />,
        description: 'Significant tensions with active military movements'
      };
    } else if (level >= 40) {
      return {
        label: 'MODERATE',
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1),
        icon: <InfoIcon />,
        description: 'Elevated tensions with diplomatic activity'
      };
    } else if (level >= 20) {
      return {
        label: 'LOW',
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1),
        icon: <InfoIcon />,
        description: 'Minimal tensions with routine monitoring'
      };
    } else {
      return {
        label: 'MINIMAL',
        color: theme.palette.success.light,
        bgColor: alpha(theme.palette.success.light, 0.1),
        icon: <InfoIcon />,
        description: 'Peaceful conditions with standard diplomatic relations'
      };
    }
  };

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up':
        return <TrendingUpIcon color="error" />;
      case 'down':
        return <TrendingDownIcon color="success" />;
      default:
        return <TrendingFlatIcon color="info" />;
    }
  };

  const intensityConfig = getIntensityConfig(data.level);

  if (variant === 'compact') {
    return (
      <Card sx={{ minWidth: 200 }}>
        <CardContent sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            {intensityConfig.icon}
            <Typography variant="h6" color={intensityConfig.color}>
              {intensityConfig.label}
            </Typography>
            {getTrendIcon()}
          </Box>
          <LinearProgress
            variant="determinate"
            value={animatedLevel}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[300],
              '& .MuiLinearProgress-bar': {
                backgroundColor: intensityConfig.color,
                borderRadius: 4,
              }
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {data.level}% Intensity
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        bgcolor: intensityConfig.bgColor,
        border: `2px solid ${intensityConfig.color}`,
        animation: data.level >= 80 ? `${pulse} 2s infinite` : 'none'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Conflict Intensity
          </Typography>
          <Chip
            icon={getTrendIcon()}
            label={data.trend.toUpperCase()}
            color={data.trend === 'up' ? 'error' : data.trend === 'down' ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>

        {/* Main Intensity Display */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ color: intensityConfig.color, fontSize: '2rem' }}>
              {intensityConfig.icon}
            </Box>
            <Typography 
              variant="h3" 
              component="div" 
              color={intensityConfig.color}
              sx={{ fontWeight: 'bold' }}
            >
              {data.level}%
            </Typography>
          </Box>
          
          <Chip
            label={intensityConfig.label}
            color={data.level >= 60 ? 'error' : data.level >= 40 ? 'warning' : 'success'}
            sx={{ 
              fontSize: '1rem', 
              fontWeight: 'bold',
              px: 2,
              py: 1
            }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 300, mx: 'auto' }}>
            {intensityConfig.description}
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={animatedLevel}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: theme.palette.grey[300],
              '& .MuiLinearProgress-bar': {
                backgroundColor: intensityConfig.color,
                borderRadius: 6,
                transition: 'width 1s ease-in-out'
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">0%</Typography>
            <Typography variant="caption" color="text.secondary">50%</Typography>
            <Typography variant="caption" color="text.secondary">100%</Typography>
          </Box>
        </Box>

        {/* Factor Breakdown */}
        {showDetails && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Contributing Factors
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {Object.entries(data.factors).map(([factor, value]) => {
                const factorName = factor
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());
                
                const factorColor = value >= 70 ? 'error' : value >= 50 ? 'warning' : 'success';
                
                return (
                  <Tooltip key={factor} title={`${factorName}: ${value}%`}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {factorName}
                        </Typography>
                        <Typography variant="caption" color={`${factorColor}.main`}>
                          {value}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={value}
                        color={factorColor}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </>
        )}

        {/* Last Update */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {data.lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Circular gauge variant
export const ConflictIntensityGauge: React.FC<{ 
  level: number; 
  size?: number;
  showLabel?: boolean;
}> = ({ 
  level, 
  size = 120,
  showLabel = true 
}) => {
  const theme = useTheme();
  const [animatedLevel, setAnimatedLevel] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedLevel(level);
    }, 500);
    return () => clearTimeout(timer);
  }, [level]);

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedLevel / 100) * circumference;

  const getColor = () => {
    if (level >= 80) return theme.palette.error.main;
    if (level >= 60) return theme.palette.warning.main;
    if (level >= 40) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.palette.grey[300]}
          strokeWidth="8"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 1.5s ease-in-out'
          }}
        />
      </svg>
      
      {/* Center text */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" component="div" color={getColor()}>
          {level}%
        </Typography>
        {showLabel && (
          <Typography variant="caption" color="text.secondary">
            Intensity
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ConflictIntensityMeter;