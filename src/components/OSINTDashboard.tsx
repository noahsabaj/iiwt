import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Badge,
} from '@mui/material';
import {
  Security as SecurityIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  FlightTakeoff as FlightIcon,
  LocalFireDepartment as FireIcon,
  Assessment as AssessmentIcon,
  Twitter as TwitterIcon,
  Telegram as TelegramIcon,
  Refresh as RefreshIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { osintService, OSINTData } from '../services/OSINTService';
import { useConflictData } from '../contexts/ConflictDataContext';

const OSINTDashboard: React.FC = () => {
  const [osintData, setOsintData] = useState<OSINTData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { data: conflictData } = useConflictData();

  useEffect(() => {
    fetchOSINTData();
    const interval = setInterval(fetchOSINTData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchOSINTData = async () => {
    try {
      setLoading(true);
      const data = await osintService.gatherIntelligence();
      setOsintData(data);
    } catch (error) {
      console.error('Error fetching OSINT data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOSINTData();
  };

  const getSeverityColor = (goldstein: number): string => {
    if (goldstein <= -7) return '#d32f2f';
    if (goldstein <= -4) return '#ff5722';
    if (goldstein <= -1) return '#ff9800';
    if (goldstein <= 1) return '#9e9e9e';
    return '#4caf50';
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 80) return '#d32f2f';
    if (intensity >= 60) return '#ff5722';
    if (intensity >= 40) return '#ff9800';
    if (intensity >= 20) return '#ffc107';
    return '#8bc34a';
  };

  if (loading && !osintData) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 1, color: '#2196f3' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            OPEN SOURCE INTELLIGENCE (OSINT)
          </Typography>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing} size="small">
              <RefreshIcon sx={{ 
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
            </IconButton>
          </Tooltip>
        </Box>

        {osintData && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
            {/* Conflict Intensity Gauge */}
            <Paper sx={{ p: 2, backgroundColor: '#0a0a0a' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon sx={{ mr: 1, fontSize: 20, color: '#ff5722' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  GDELT CONFLICT INTENSITY
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={osintData.gdelt.conflictIntensity}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#1a1a1a',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getIntensityColor(osintData.gdelt.conflictIntensity),
                      }
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: getIntensityColor(osintData.gdelt.conflictIntensity) }}>
                  {osintData.gdelt.conflictIntensity}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Based on {osintData.gdelt.events.length} events in last 24h
              </Typography>
            </Paper>

            {/* ACLED Statistics */}
            <Paper sx={{ p: 2, backgroundColor: '#0a0a0a' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1, fontSize: 20, color: '#d32f2f' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ACLED VERIFIED EVENTS (24H)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                    {osintData.acled.fatalities24h}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fatalities
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff5722' }}>
                    {osintData.acled.battleEvents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Battles
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800' }}>
                    {osintData.acled.explosionEvents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Explosions
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </CardContent>

      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {osintData && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, flex: 1, overflow: 'hidden' }}>
            {/* Hotspots */}
            <Box sx={{ borderRight: 1, borderColor: 'divider', height: '100%' }}>
              <Box sx={{ p: 2, backgroundColor: '#0a0a0a', height: '100%', overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  <LocationIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  CONFLICT HOTSPOTS
                </Typography>
                <List dense>
                  {osintData.gdelt.hotspots.map((hotspot, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CircleIcon 
                          sx={{ 
                            fontSize: 12, 
                            color: getIntensityColor(hotspot.intensity) 
                          }} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{hotspot.location}</Typography>
                            <Chip
                              label={`${Math.round(hotspot.intensity)}%`}
                              size="small"
                              sx={{ 
                                height: 20,
                                backgroundColor: getIntensityColor(hotspot.intensity),
                                color: 'white'
                              }}
                            />
                          </Box>
                        }
                        secondary={`${hotspot.lat.toFixed(2)}, ${hotspot.lng.toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>

            {/* Recent GDELT Events */}
            <Box sx={{ borderRight: 1, borderColor: 'divider', height: '100%' }}>
              <Box sx={{ p: 2, backgroundColor: '#0a0a0a', height: '100%', overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  <TrendingIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  GDELT REAL-TIME EVENTS
                </Typography>
                <List dense>
                  {osintData.gdelt.events.slice(0, 10).map((event, index) => (
                    <ListItem key={event.globalEventID} sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {event.actor1Name} → {event.actor2Name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                              <Chip
                                label={event.eventCode.replace(/_/g, ' ')}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                              <Chip
                                label={`GS: ${event.goldsteinScale.toFixed(1)}`}
                                size="small"
                                sx={{ 
                                  height: 18, 
                                  fontSize: '0.65rem',
                                  backgroundColor: getSeverityColor(event.goldsteinScale),
                                  color: 'white'
                                }}
                              />
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {event.actionGeo_FullName || 'Unknown location'} • 
                            {new Date(event.eventDate).toLocaleTimeString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>

            {/* Social Intelligence */}
            <Box sx={{ height: '100%' }}>
              <Box sx={{ p: 2, backgroundColor: '#0a0a0a', height: '100%', overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  <TwitterIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  SOCIAL OSINT
                </Typography>
                
                {/* Breaking Alerts */}
                <Typography variant="caption" sx={{ color: '#ff5722', fontWeight: 600 }}>
                  BREAKING ALERTS
                </Typography>
                <List dense sx={{ mb: 2 }}>
                  {osintData.socialIntel.breakingAlerts.map((alert, index) => (
                    <ListItem key={index} sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {alert.source.includes('@') ? 
                                <TwitterIcon sx={{ fontSize: 14 }} /> : 
                                <TelegramIcon sx={{ fontSize: 14 }} />
                              }
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {alert.source}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                              {alert.message}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Trending Topics */}
                <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600 }}>
                  TRENDING TOPICS
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {osintData.socialIntel.trendingTopics.map((topic, index) => (
                    <Chip
                      key={index}
                      label={topic}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                      color={topic.startsWith('#') ? 'primary' : 'default'}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

    </Card>
  );
};

export default OSINTDashboard;