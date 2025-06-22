import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Factory as FactoryIcon,
  Dangerous as RadioactiveIcon,
} from '@mui/icons-material';

interface NuclearFacility {
  id: string;
  name: string;
  location: string;
  status: 'operational' | 'damaged' | 'evacuated' | 'offline';
  lastStrike: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  radiationRisk: 'none' | 'low' | 'moderate' | 'high';
}

const NuclearFacilitiesMonitor: React.FC = () => {
  const [facilities, setFacilities] = useState<NuclearFacility[]>([
    {
      id: '1',
      name: 'Arak Heavy Water Reactor',
      location: 'Arak, Iran',
      status: 'evacuated',
      lastStrike: '6 hours ago',
      severity: 'high',
      radiationRisk: 'none',
    },
    {
      id: '2',
      name: 'Natanz Nuclear Facility',
      location: 'Natanz, Iran',
      status: 'damaged',
      lastStrike: '2 days ago',
      severity: 'critical',
      radiationRisk: 'moderate',
    },
    {
      id: '3',
      name: 'Bushehr Nuclear Plant',
      location: 'Bushehr, Iran',
      status: 'operational',
      lastStrike: 'Never',
      severity: 'low',
      radiationRisk: 'none',
    },
    {
      id: '4',
      name: 'Fordow Fuel Enrichment',
      location: 'Qom, Iran',
      status: 'offline',
      lastStrike: '1 day ago',
      severity: 'high',
      radiationRisk: 'low',
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'damaged': return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'evacuated': return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'offline': return <ErrorIcon sx={{ color: '#9e9e9e' }} />;
      default: return <WarningIcon />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'operational': return 'success';
      case 'damaged': return 'error';
      case 'evacuated': return 'warning';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string): 'success' | 'warning' | 'error' => {
    switch (severity) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high':
      case 'critical': return 'error';
      default: return 'warning';
    }
  };

  const getRadiationColor = (risk: string): 'success' | 'warning' | 'error' => {
    switch (risk) {
      case 'none': return 'success';
      case 'low': return 'warning';
      case 'moderate':
      case 'high': return 'error';
      default: return 'success';
    }
  };

  const operationalCount = facilities.filter(f => f.status === 'operational').length;
  const damagedCount = facilities.filter(f => f.status === 'damaged').length;
  const evacuatedCount = facilities.filter(f => f.status === 'evacuated').length;
  const offlineCount = facilities.filter(f => f.status === 'offline').length;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <RadioactiveIcon sx={{ mr: 1, color: '#ff9800' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            NUCLEAR FACILITIES STATUS
          </Typography>
        </Box>

        {/* Radiation Warning */}
        <Alert 
          severity="warning" 
          sx={{ mb: 2, fontSize: '0.875rem' }}
          icon={<RadioactiveIcon />}
        >
          UN reports radiological contamination at Natanz facility
        </Alert>

        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip 
            label={`${operationalCount} Operational`} 
            color="success" 
            size="small" 
          />
          <Chip 
            label={`${damagedCount} Damaged`} 
            color="error" 
            size="small" 
          />
          <Chip 
            label={`${evacuatedCount} Evacuated`} 
            color="warning" 
            size="small" 
          />
          <Chip 
            label={`${offlineCount} Offline`} 
            color="default" 
            size="small" 
          />
        </Box>

        {/* Facilities List */}
        <List dense>
          {facilities.map((facility, index) => (
            <ListItem 
              key={facility.id} 
              sx={{ 
                px: 0,
                py: 1,
                borderBottom: index < facilities.length - 1 ? '1px solid #333' : 'none'
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {getStatusIcon(facility.status)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {facility.name}
                    </Typography>
                    <Chip
                      label={facility.status.toUpperCase()}
                      color={getStatusColor(facility.status)}
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      📍 {facility.location}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                      <Chip
                        label={`Severity: ${facility.severity}`}
                        color={getSeverityColor(facility.severity)}
                        size="small"
                        sx={{ fontSize: '0.6rem', height: 18 }}
                      />
                      <Chip
                        label={`Radiation: ${facility.radiationRisk}`}
                        color={getRadiationColor(facility.radiationRisk)}
                        size="small"
                        sx={{ fontSize: '0.6rem', height: 18 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Last strike: {facility.lastStrike}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <LinearProgress 
          variant="determinate"
          value={(damagedCount + offlineCount) / facilities.length * 100}
          color="error"
          sx={{ 
            mt: 2, 
            height: 6, 
            borderRadius: 3,
            backgroundColor: '#333'
          }} 
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {Math.round((damagedCount + offlineCount) / facilities.length * 100)}% of facilities compromised
        </Typography>
      </CardContent>
    </Card>
  );
};

export default NuclearFacilitiesMonitor;