import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Public as GlobalIcon,
  Remove as StableIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';
import { THREAT_LEVELS, THREAT_TRENDS, FACILITY_STATUS } from '../constants';
import { Facility } from '../types';

interface ThreatLevelConfig {
  level: number;
  name: string;
  description: string;
  color: string;
  bgColor: string;
}

const ThreatLevelIndicator: React.FC = () => {
  const { data: conflictData } = useConflictData();

  if (!conflictData) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <LinearProgress sx={{ width: '80%' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const { threatLevel } = conflictData;

  const threatLevelConfigs: ThreatLevelConfig[] = [
    { level: 1, name: 'LOW', description: 'Minimal threat', color: '#4caf50', bgColor: '#1a2e1a' },
    { level: 2, name: 'GUARDED', description: 'General risk', color: '#8bc34a', bgColor: '#1e2a1e' },
    { level: 3, name: 'ELEVATED', description: 'Significant risk', color: '#ff9800', bgColor: '#2a1f10' },
    { level: 4, name: 'HIGH', description: 'High likelihood of attacks', color: '#ff5722', bgColor: '#2a1510' },
    { level: 5, name: 'SEVERE', description: 'Severe risk - attacks imminent', color: '#d32f2f', bgColor: '#2a1010' },
  ];

  const currentThreatLevelConfig = threatLevelConfigs[threatLevel.globalLevel - 1] || threatLevelConfigs[3];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case THREAT_TRENDS.INCREASING: return <TrendingUpIcon sx={{ color: '#f44336', fontSize: 16 }} />;
      case THREAT_TRENDS.DECREASING: return <TrendingDownIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
      case THREAT_TRENDS.STABLE: return <StableIcon sx={{ color: '#666', fontSize: 16 }} />;
      default: return null;
    }
  };

  const getTrendColor = (trend: string): 'error' | 'success' | 'default' => {
    switch (trend) {
      case THREAT_TRENDS.INCREASING: return 'error';
      case THREAT_TRENDS.DECREASING: return 'success';
      default: return 'default';
    }
  };

  // Determine if nuclear facilities are under threat
  const facilitiesUnderThreat = conflictData.facilities.filter((f: Facility) => 
    f.status === FACILITY_STATUS.DAMAGED || f.status === FACILITY_STATUS.EVACUATED
  ).length > 0;

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
            backgroundColor: currentThreatLevelConfig.bgColor,
            border: `2px solid ${currentThreatLevelConfig.color}`,
            borderRadius: 2,
            p: 2,
            mb: 3,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: currentThreatLevelConfig.color,
              fontWeight: 700,
              mb: 1,
            }}
          >
            {threatLevel.globalLevel}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: currentThreatLevelConfig.color,
              fontWeight: 600,
              mb: 1,
            }}
          >
            {currentThreatLevelConfig.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentThreatLevelConfig.description}
          </Typography>
          
          <LinearProgress
            variant="determinate"
            value={threatLevel.globalLevel * 20}
            sx={{
              mt: 2,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#333',
              '& .MuiLinearProgress-bar': {
                backgroundColor: currentThreatLevelConfig.color,
              },
            }}
          />
        </Box>

        {/* Dynamic Alert */}
        {facilitiesUnderThreat && (
          <Alert
            severity="error"
            icon={<WarningIcon />}
            sx={{ mb: 3, fontSize: '0.875rem' }}
          >
            Nuclear facilities under active threat
          </Alert>
        )}

        {threatLevel.globalLevel >= 4 && !facilitiesUnderThreat && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 3, fontSize: '0.875rem' }}
          >
            Heightened military activity detected
          </Alert>
        )}

        {/* Regional Threats */}
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          REGIONAL THREAT LEVELS
        </Typography>

        {threatLevel.regions.map((region: any, index: number) => (
          <Box
            key={region.name}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1,
              borderBottom: index < threatLevel.regions.length - 1 ? '1px solid #333' : 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <GlobalIcon sx={{ mr: 1, fontSize: 16, color: '#666' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {region.name}
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