import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';
import { THREAT_TRENDS } from '../constants';

const CasualtyCounter: React.FC = () => {
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

  const { casualties } = conflictData;

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case THREAT_TRENDS.INCREASING: return 'error';
      case THREAT_TRENDS.STABLE: return 'warning';
      case THREAT_TRENDS.DECREASING: return 'success';
      default: return 'default';
    }
  };

  // Calculate trends based on data updates
  const getTrend = (country: 'israel' | 'iran'): string => {
    // In a real app, we'd compare with historical data
    // For now, base it on recent update time
    const lastUpdate = casualties[country].lastUpdate;
    if (lastUpdate.includes('Just now') || lastUpdate.includes('min')) {
      return THREAT_TRENDS.INCREASING;
    }
    return THREAT_TRENDS.STABLE;
  };

  const totalCasualties = casualties.israel.deaths + casualties.iran.deaths;
  const totalInjured = casualties.israel.injured + casualties.iran.injured;

  const data = [
    {
      country: 'Israel',
      flag: '🇮🇱',
      casualties: casualties.israel.deaths,
      injured: casualties.israel.injured,
      lastUpdate: casualties.israel.lastUpdate,
      trend: getTrend('israel'),
    },
    {
      country: 'Iran',
      flag: '🇮🇷',
      casualties: casualties.iran.deaths,
      injured: casualties.iran.injured,
      lastUpdate: casualties.iran.lastUpdate,
      trend: getTrend('iran'),
    },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ mr: 1, color: '#d32f2f' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            CASUALTY REPORT
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              icon={<UpdateIcon />}
              label="LIVE"
              color="error"
              size="small"
              variant="outlined"
              sx={{
                animation: 'blink 2s infinite',
                '@keyframes blink': {
                  '0%, 50%': { opacity: 1 },
                  '51%, 100%': { opacity: 0.5 },
                },
              }}
            />
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1, textAlign: 'center', p: 2, backgroundColor: '#2a1010', borderRadius: 1 }}>
            <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 700 }}>
              {totalCasualties.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Casualties
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center', p: 2, backgroundColor: '#2a1a10', borderRadius: 1 }}>
            <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
              {totalInjured.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Injured
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Country-specific data */}
        {data.map((item, index) => (
          <Box key={item.country} sx={{ mb: index < data.length - 1 ? 3 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ mr: 1 }}>
                {item.flag}
              </Typography>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                {item.country}
              </Typography>
              <Chip
                label={item.trend}
                color={getTrendColor(item.trend) as any}
                size="small"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, fontSize: 16, color: '#f44336' }} />
                <Box>
                  <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 600 }}>
                    {item.casualties.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Casualties
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <HospitalIcon sx={{ mr: 1, fontSize: 16, color: '#ff9800' }} />
                <Box>
                  <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>
                    {item.injured.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Injured
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {item.lastUpdate}
            </Typography>

            {index < data.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}

        <LinearProgress 
          color="error" 
          sx={{ 
            mt: 2, 
            height: 6, 
            borderRadius: 3,
            backgroundColor: '#333'
          }} 
        />
      </CardContent>
    </Card>
  );
};

export default CasualtyCounter;