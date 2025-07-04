import React from 'react';
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
  Dangerous as RadioactiveIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';
import { FACILITY_STATUS, RADIATION_RISK } from '../constants';
import { Facility } from '../types';

const NuclearFacilitiesMonitor: React.FC = () => {
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

  const { facilities } = conflictData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case FACILITY_STATUS.OPERATIONAL: return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case FACILITY_STATUS.DAMAGED: return <ErrorIcon sx={{ color: '#f44336' }} />;
      case FACILITY_STATUS.EVACUATED: return <WarningIcon sx={{ color: '#ff9800' }} />;
      case FACILITY_STATUS.OFFLINE: return <ErrorIcon sx={{ color: '#9e9e9e' }} />;
      default: return <WarningIcon />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case FACILITY_STATUS.OPERATIONAL: return 'success';
      case FACILITY_STATUS.DAMAGED: return 'error';
      case FACILITY_STATUS.EVACUATED: return 'warning';
      case FACILITY_STATUS.OFFLINE: return 'default';
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
      case RADIATION_RISK.NONE: return 'success';
      case RADIATION_RISK.LOW: return 'warning';
      case RADIATION_RISK.MODERATE:
      case RADIATION_RISK.HIGH: return 'error';
      default: return 'success';
    }
  };

  const operationalCount = facilities.filter((f: Facility) => f.status === FACILITY_STATUS.OPERATIONAL).length;
  const damagedCount = facilities.filter((f: Facility) => f.status === FACILITY_STATUS.DAMAGED).length;
  const evacuatedCount = facilities.filter((f: Facility) => f.status === FACILITY_STATUS.EVACUATED).length;
  const offlineCount = facilities.filter((f: Facility) => f.status === FACILITY_STATUS.OFFLINE).length;

  // Find facilities with radiation risk
  const facilitiesWithRadiation = facilities.filter((f: Facility) => 
    f.radiationRisk !== RADIATION_RISK.NONE
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <RadioactiveIcon sx={{ mr: 1, color: '#ff9800' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            NUCLEAR FACILITIES STATUS
          </Typography>
        </Box>

        {/* Dynamic Radiation Warning */}
        {facilitiesWithRadiation.length > 0 && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2, fontSize: '0.875rem' }}
            icon={<RadioactiveIcon />}
          >
            {facilitiesWithRadiation.length === 1 
              ? `Radiation detected at ${facilitiesWithRadiation[0].name}`
              : `Radiation detected at ${facilitiesWithRadiation.length} facilities`
            }
          </Alert>
        )}

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
          {facilities.map((facility: Facility, index: number) => (
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
                      {facility.severity && (
                        <Chip
                          label={`Severity: ${facility.severity}`}
                        color={getSeverityColor(facility.severity || 'low')}
                        size="small"
                        sx={{ fontSize: '0.6rem', height: 18 }}
                      />
                      )}
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