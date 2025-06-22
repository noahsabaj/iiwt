import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
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

interface CasualtyData {
  country: string;
  flag: string;
  casualties: number;
  injured: number;
  lastUpdate: string;
  trend: 'increasing' | 'stable' | 'decreasing';
}

const CasualtyCounter: React.FC = () => {
  const [data, setData] = useState<CasualtyData[]>([
    {
      country: 'Israel',
      flag: '🇮🇱',
      casualties: 24,
      injured: 685,
      lastUpdate: '2 min ago',
      trend: 'increasing',
    },
    {
      country: 'Iran',
      flag: '🇮🇷',
      casualties: 156,
      injured: 892,
      lastUpdate: '5 min ago',
      trend: 'increasing',
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData =>
        prevData.map(item => ({
          ...item,
          // Simulate small random increases
          casualties: item.casualties + (Math.random() > 0.95 ? 1 : 0),
          injured: item.injured + (Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0),
          lastUpdate: Math.random() > 0.7 ? 'Just now' : item.lastUpdate,
        }))
      );
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'error';
      case 'stable': return 'warning';
      case 'decreasing': return 'success';
      default: return 'default';
    }
  };

  const totalCasualties = data.reduce((sum, item) => sum + item.casualties, 0);
  const totalInjured = data.reduce((sum, item) => sum + item.injured, 0);

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
              {totalCasualties}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Casualties
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center', p: 2, backgroundColor: '#2a1a10', borderRadius: 1 }}>
            <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
              {totalInjured}
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
                    {item.casualties}
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
                    {item.injured}
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