import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Public as GlobalIcon,
} from '@mui/icons-material';

interface ThreatLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  color: string;
  bgColor: string;
}

interface RegionalThreat {
  region: string;
  level: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdate: string;
}

const ThreatLevelIndicator: React.FC = () => {
  const [currentThreatLevel, setCurrentThreatLevel] = useState<ThreatLevel>({
    level: 4,
    name: 'SEVERE',
    description: 'High likelihood of attacks',
    color: '#d32f2f',
    bgColor: '#2a1010',
  });

  const [regionalThreats, setRegionalThreats] = useState<RegionalThreat[]>([
    { region: 'Middle East', level: 5, trend: 'increasing', lastUpdate: '2 min ago' },
    { region: 'Mediterranean', level: 3, trend: 'stable', lastUpdate: '15 min ago' },
    { region: 'Persian Gulf', level: 4, trend: 'increasing', lastUpdate: '5 min ago' },
    { region: 'Red Sea', level: 3, trend: 'increasing', lastUpdate: '8 min ago' },
  ]);

  const threatLevels: ThreatLevel[] = [
    { level: 1, name: 'LOW', description: 'Minimal threat', color: '#4caf50', bgColor: '#1a2e1a' },
    { level: 2, name: 'GUARDED', description: 'General risk', color: '#8bc34a', bgColor: '#1e2a1e' },
    { level: 3, name: 'ELEVATED', description: 'Significant risk', color: '#ff9800', bgColor: '#2a1f10' },
    { level: 4, name: 'HIGH', description: 'High likelihood of attacks', color: '#ff5722', bgColor: '#2a1510' },
    { level: 5, name: 'SEVERE', description: 'Severe risk - attacks imminent', color: '#d32f2f', bgColor: '#2a1010' },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUpIcon sx={{ color: '#f44336', fontSize: 16 }} />;
      case 'decreasing': return <TrendingDownIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
      default: return null;
    }
  };

  const getTrendColor = (trend: string): 'error' | 'success' | 'default' => {
    switch (trend) {
      case 'increasing': return 'error';
      case 'decreasing': return 'success';
      default: return 'default';
    }
  };

  // Simulate threat level changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Small chance to change threat level
      if (Math.random() > 0.95) {
        const newLevel = Math.max(3, Math.min(5, currentThreatLevel.level + (Math.random() > 0.5 ? 1 : -1)));
        setCurrentThreatLevel(threatLevels[newLevel - 1]);
      }

      // Update regional threats
      setRegionalThreats(prev =>
        prev.map(region => ({
          ...region,
          level: Math.max(2, Math.min(5, region.level + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))),
          lastUpdate: Math.random() > 0.7 ? 'Just now' : region.lastUpdate,
        }))
      );
    }, 15000);

    return () => clearInterval(interval);
  }, [currentThreatLevel]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 1, color: '#ff9800' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            THREAT ASSESSMENT
          </Typography>
        </Box>

        {/* Current Threat Level */}
        <Box
          sx={{
            backgroundColor: currentThreatLevel.bgColor,
            border: `2px solid ${currentThreatLevel.color}`,
            borderRadius: 2,
            p: 2,
            mb: 3,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: currentThreatLevel.color,
              fontWeight: 700,
              mb: 1,
            }}
          >
            {currentThreatLevel.level}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: currentThreatLevel.color,
              fontWeight: 600,
              mb: 1,
            }}
          >
            {currentThreatLevel.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentThreatLevel.description}
          </Typography>
          
          <LinearProgress
            variant="determinate"
            value={currentThreatLevel.level * 20}
            sx={{
              mt: 2,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#333',
              '& .MuiLinearProgress-bar': {
                backgroundColor: currentThreatLevel.color,
              },
            }}
          />
        </Box>

        {/* Alert */}
        <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{ mb: 3, fontSize: '0.875rem' }}
        >
          Nuclear facilities under active threat
        </Alert>

        {/* Regional Threats */}
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          REGIONAL THREAT LEVELS
        </Typography>

        {regionalThreats.map((region, index) => (
          <Box
            key={region.region}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1,
              borderBottom: index < regionalThreats.length - 1 ? '1px solid #333' : 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <GlobalIcon sx={{ mr: 1, fontSize: 16, color: '#666' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {region.region}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`L${region.level}`}
                color={region.level >= 4 ? 'error' : region.level >= 3 ? 'warning' : 'success'}
                size="small"
                sx={{ minWidth: 40, fontSize: '0.7rem' }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getTrendIcon(region.trend)}
                <Chip
                  label={region.trend}
                  color={getTrendColor(region.trend)}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 0.5, fontSize: '0.6rem', height: 20 }}
                />
              </Box>
            </Box>
          </Box>
        ))}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Based on current conflict activity and intelligence assessments
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ThreatLevelIndicator;