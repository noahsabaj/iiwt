import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  Divider,
  Alert,
  Paper,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Security as SecurityIcon,
  RadioButtonChecked as ActiveIcon,
  Schedule as StandbyIcon,
  RemoveCircleOutline as NeutralIcon,
  TrendingUp as IncreasingIcon,
  TrendingDown as DecreasingIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';

interface RegionalAlly {
  id: string;
  name: string;
  flag: string;
  alignment: 'Pro-Israel' | 'Pro-Iran' | 'Neutral' | 'US Coalition';
  status: 'active' | 'standby' | 'neutral' | 'engaged';
  militaryStrength: {
    personnel: number;
    readiness: number; // 0-100%
  };
  recentActivity: string[];
  involementLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'full';
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdate: string;
  keyAssets?: string[];
  location?: string;
}

const RegionalAlliesMonitor: React.FC = () => {
  const { data, loading } = useConflictData();

  // Mock allies data - in production, this would be extracted from news and intelligence
  const allies: RegionalAlly[] = [
    {
      id: '1',
      name: 'Hezbollah',
      flag: '🇱🇧',
      alignment: 'Pro-Iran',
      status: 'active',
      militaryStrength: {
        personnel: 100000,
        readiness: 85,
      },
      recentActivity: [
        'Rocket attacks on northern Israel',
        'Mobilization along Lebanese border',
        'Coordination with Iranian advisors'
      ],
      involementLevel: 'significant',
      trend: 'increasing',
      lastUpdate: '2 hours ago',
      keyAssets: ['150,000+ rockets', 'Precision missiles', 'Drone fleet'],
      location: 'Lebanon'
    },
    {
      id: '2',
      name: 'United States Forces',
      flag: '🇺🇸',
      alignment: 'Pro-Israel',
      status: 'engaged',
      militaryStrength: {
        personnel: 40000,
        readiness: 95,
      },
      recentActivity: [
        'Carrier strike group deployed to Eastern Mediterranean',
        'Patriot batteries reinforced in region',
        'Strategic bomber presence increased'
      ],
      involementLevel: 'significant',
      trend: 'increasing',
      lastUpdate: '30 min ago',
      keyAssets: ['USS Gerald Ford CSG', '2 Destroyer squadrons', 'F-35 squadrons'],
      location: 'Multiple bases'
    },
    {
      id: '3',
      name: 'Houthis (Ansar Allah)',
      flag: '🇾🇪',
      alignment: 'Pro-Iran',
      status: 'active',
      militaryStrength: {
        personnel: 200000,
        readiness: 70,
      },
      recentActivity: [
        'Missile attacks on Red Sea shipping',
        'Drone strikes on Saudi infrastructure',
        'Threats to Israeli-linked vessels'
      ],
      involementLevel: 'moderate',
      trend: 'stable',
      lastUpdate: '5 hours ago',
      keyAssets: ['Ballistic missiles', 'Naval mines', 'Attack drones'],
      location: 'Yemen'
    },
    {
      id: '4',
      name: 'Iraqi Militias (PMF)',
      flag: '🇮🇶',
      alignment: 'Pro-Iran',
      status: 'standby',
      militaryStrength: {
        personnel: 150000,
        readiness: 60,
      },
      recentActivity: [
        'Drone attacks on US bases',
        'Mobilization near Syrian border',
        'IRGC coordination meetings'
      ],
      involementLevel: 'minimal',
      trend: 'increasing',
      lastUpdate: '8 hours ago',
      keyAssets: ['Katyusha rockets', 'IRAMs', 'Suicide drones'],
      location: 'Iraq/Syria border'
    },
    {
      id: '5',
      name: 'Saudi Arabia',
      flag: '🇸🇦',
      alignment: 'Neutral',
      status: 'neutral',
      militaryStrength: {
        personnel: 250000,
        readiness: 80,
      },
      recentActivity: [
        'Defensive posture maintained',
        'Air defense systems on high alert',
        'Diplomatic channels active'
      ],
      involementLevel: 'none',
      trend: 'stable',
      lastUpdate: '1 day ago',
      keyAssets: ['Patriot systems', 'F-15 fleet', 'THAAD'],
      location: 'Saudi Arabia'
    },
    {
      id: '6',
      name: 'Jordan',
      flag: '🇯🇴',
      alignment: 'US Coalition',
      status: 'standby',
      militaryStrength: {
        personnel: 100000,
        readiness: 75,
      },
      recentActivity: [
        'Border security enhanced',
        'Coordination with US forces',
        'Refugee preparations'
      ],
      involementLevel: 'minimal',
      trend: 'stable',
      lastUpdate: '12 hours ago',
      keyAssets: ['F-16 squadrons', 'Border defenses'],
      location: 'Jordan'
    },
    {
      id: '7',
      name: 'Egypt',
      flag: '🇪🇬',
      alignment: 'Neutral',
      status: 'neutral',
      militaryStrength: {
        personnel: 450000,
        readiness: 70,
      },
      recentActivity: [
        'Sinai security operations',
        'Gaza border monitoring',
        'Mediation efforts'
      ],
      involementLevel: 'none',
      trend: 'stable',
      lastUpdate: '1 day ago',
      keyAssets: ['F-16 fleet', 'Apache helicopters', 'Navy vessels'],
      location: 'Egypt'
    },
    {
      id: '8',
      name: 'Syria',
      flag: '🇸🇾',
      alignment: 'Pro-Iran',
      status: 'engaged',
      militaryStrength: {
        personnel: 150000,
        readiness: 50,
      },
      recentActivity: [
        'Iranian weapons transfers facilitated',
        'Air defense engagement with Israeli jets',
        'Hosting IRGC advisors'
      ],
      involementLevel: 'moderate',
      trend: 'stable',
      lastUpdate: '6 hours ago',
      keyAssets: ['S-300 systems', 'Ballistic missiles'],
      location: 'Syria'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'engaged':
        return <ActiveIcon sx={{ color: '#f44336' }} />;
      case 'standby':
        return <StandbyIcon sx={{ color: '#ff9800' }} />;
      case 'neutral':
        return <NeutralIcon sx={{ color: '#666' }} />;
      default:
        return null;
    }
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'Pro-Israel':
      case 'US Coalition':
        return '#2196f3';
      case 'Pro-Iran':
        return '#f44336';
      case 'Neutral':
        return '#666';
      default:
        return '#666';
    }
  };

  const getInvolvementColor = (level: string) => {
    switch (level) {
      case 'full': return '#d32f2f';
      case 'significant': return '#f44336';
      case 'moderate': return '#ff9800';
      case 'minimal': return '#ffc107';
      case 'none': return '#4caf50';
      default: return '#666';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <IncreasingIcon sx={{ color: '#f44336', fontSize: 16 }} />;
      case 'decreasing': return <DecreasingIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
      default: return null;
    }
  };

  if (loading || !data) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading regional allies data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const activeAllies = allies.filter(a => a.status === 'active' || a.status === 'engaged');
  const groupedAllies = {
    'Pro-Iran': allies.filter(a => a.alignment === 'Pro-Iran'),
    'Pro-Israel': allies.filter(a => a.alignment === 'Pro-Israel' || a.alignment === 'US Coalition'),
    'Neutral': allies.filter(a => a.alignment === 'Neutral'),
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <GroupsIcon sx={{ mr: 1, color: '#ff5722' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            REGIONAL ALLIES & ACTORS
          </Typography>
          <Chip
            icon={<WarningIcon sx={{ fontSize: 16 }} />}
            label={`${activeAllies.length} ACTIVE`}
            color="error"
            size="small"
          />
        </Box>

        {/* Active Engagement Alert */}
        {activeAllies.length > 3 && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
            Multiple regional actors actively engaged - risk of wider regional conflict
          </Alert>
        )}

        {/* Grouped by Alignment */}
        {Object.entries(groupedAllies).map(([alignment, allyGroup]) => (
          <Box key={alignment} sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 1, 
                fontWeight: 600,
                color: getAlignmentColor(alignment)
              }}
            >
              {alignment.toUpperCase()} FORCES
            </Typography>
            
            <List dense sx={{ p: 0 }}>
              {allyGroup.map((ally, index) => (
                <React.Fragment key={ally.id}>
                  <Paper sx={{ p: 2, mb: 1, backgroundColor: '#0a0a0a' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1, fontSize: '1.2rem' }}>
                        {ally.flag}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {ally.name}
                          </Typography>
                          {getStatusIcon(ally.status)}
                        </Box>
                        {ally.location && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationIcon sx={{ fontSize: 12, mr: 0.5, color: '#666' }} />
                            <Typography variant="caption" color="text.secondary">
                              {ally.location}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={ally.involementLevel}
                          size="small"
                          sx={{
                            backgroundColor: getInvolvementColor(ally.involementLevel),
                            color: 'white',
                            fontSize: '0.65rem',
                            mb: 0.5
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {getTrendIcon(ally.trend)}
                          <Typography variant="caption" color="text.secondary">
                            {ally.trend}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Military Strength */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Forces: {ally.militaryStrength.personnel.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Readiness: 
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={ally.militaryStrength.readiness}
                          sx={{
                            width: 60,
                            height: 3,
                            ml: 1,
                            display: 'inline-flex',
                            verticalAlign: 'middle',
                            borderRadius: 2,
                            backgroundColor: '#333',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: ally.militaryStrength.readiness > 80 ? '#4caf50' : 
                                             ally.militaryStrength.readiness > 60 ? '#ff9800' : '#f44336'
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {ally.militaryStrength.readiness}%
                        </Typography>
                      </Box>
                    </Box>

                    {/* Recent Activity */}
                    {ally.recentActivity.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#888' }}>
                          RECENT ACTIVITY:
                        </Typography>
                        <List dense sx={{ p: 0, mt: 0.5 }}>
                          {ally.recentActivity.map((activity, idx) => (
                            <ListItem key={idx} sx={{ p: 0, pl: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                • {activity}
                              </Typography>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* Key Assets */}
                    {ally.keyAssets && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {ally.keyAssets.map((asset, idx) => (
                          <Chip
                            key={idx}
                            label={asset}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        ))}
                      </Box>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Updated: {ally.lastUpdate}
                    </Typography>
                  </Paper>
                </React.Fragment>
              ))}
            </List>
          </Box>
        ))}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Regional involvement tracked from intelligence reports and military movements
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RegionalAlliesMonitor;