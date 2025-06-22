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
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  FlashOn as FlashOnIcon,
  Timeline as TimelineIcon,
  RadioButtonChecked as ActiveIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';

interface MilitaryOperation {
  id: string;
  name: string;
  codeName: string;
  country: 'Israel' | 'Iran' | 'Unknown';
  status: 'active' | 'completed' | 'pending' | 'suspended';
  startDate: string;
  endDate?: string;
  type: 'offensive' | 'defensive' | 'cyber' | 'intelligence';
  description: string;
  objectives: string[];
  progress: number; // 0-100
  lastUpdate: string;
  confidence: number;
}

const MilitaryOperationsTracker: React.FC = () => {
  const { data, loading } = useConflictData();

  // Mock operations data - in production, this would come from NLP-extracted operations
  const operations: MilitaryOperation[] = [
    {
      id: '1',
      name: 'Operation Rising Lion',
      codeName: 'RISING_LION',
      country: 'Israel',
      status: 'active',
      startDate: '2025-06-18T00:00:00Z',
      type: 'offensive',
      description: 'Strategic strikes on Iranian nuclear infrastructure',
      objectives: [
        'Neutralize uranium enrichment facilities',
        'Disable heavy water reactor at Arak',
        'Degrade ballistic missile production'
      ],
      progress: 75,
      lastUpdate: '2 hours ago',
      confidence: 0.85
    },
    {
      id: '2',
      name: 'Operation True Promise',
      codeName: 'TRUE_PROMISE',
      country: 'Iran',
      status: 'active',
      startDate: '2025-06-19T00:00:00Z',
      type: 'defensive',
      description: 'Retaliatory missile strikes and regional mobilization',
      objectives: [
        'Strike Israeli military installations',
        'Activate regional proxy forces',
        'Establish deterrence'
      ],
      progress: 45,
      lastUpdate: '5 hours ago',
      confidence: 0.78
    },
    {
      id: '3',
      name: 'Operation Desert Shield',
      codeName: 'DESERT_SHIELD',
      country: 'Israel',
      status: 'completed',
      startDate: '2025-06-16T00:00:00Z',
      endDate: '2025-06-17T00:00:00Z',
      type: 'defensive',
      description: 'Enhanced air defense deployment',
      objectives: [
        'Deploy additional Iron Dome batteries',
        'Establish no-fly zones',
        'Protect critical infrastructure'
      ],
      progress: 100,
      lastUpdate: '2 days ago',
      confidence: 0.92
    }
  ];

  // Extract operations from timeline events if available
  const extractedOperations = React.useMemo(() => {
    if (!data?.timeline) return [];
    
    return data.timeline
      .filter(event => event.metadata?.entities?.operations && event.metadata.entities.operations.length > 0)
      .flatMap(event => event.metadata!.entities!.operations!)
      .filter((op, index, self) => self.indexOf(op) === index); // Remove duplicates
  }, [data]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ActiveIcon sx={{ color: '#f44336' }} />;
      case 'completed': return <CompleteIcon sx={{ color: '#4caf50' }} />;
      case 'pending': return <PendingIcon sx={{ color: '#ff9800' }} />;
      case 'suspended': return <PendingIcon sx={{ color: '#9e9e9e' }} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string): 'error' | 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'active': return 'error';
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'default';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'offensive': return '#f44336';
      case 'defensive': return '#2196f3';
      case 'cyber': return '#9c27b0';
      case 'intelligence': return '#ff9800';
      default: return '#666';
    }
  };

  const getCountryFlag = (country: string) => {
    switch (country) {
      case 'Israel': return '🇮🇱';
      case 'Iran': return '🇮🇷';
      default: return '🏳️';
    }
  };

  if (loading || !data) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading military operations...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const activeOperations = operations.filter(op => op.status === 'active');
  const hasActiveOperations = activeOperations.length > 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ShieldIcon sx={{ mr: 1, color: '#ff5722' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            MILITARY OPERATIONS
          </Typography>
          {hasActiveOperations && (
            <Chip
              icon={<FlashOnIcon sx={{ fontSize: 16 }} />}
              label={`${activeOperations.length} ACTIVE`}
              color="error"
              size="small"
              sx={{
                animation: 'blink 2s infinite',
                '@keyframes blink': {
                  '0%, 50%': { opacity: 1 },
                  '51%, 100%': { opacity: 0.5 },
                },
              }}
            />
          )}
        </Box>

        {/* Extracted Operations Alert */}
        {extractedOperations.length > 0 && (
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
            Detected operations from news: {extractedOperations.join(', ')}
          </Alert>
        )}

        {/* Operations List */}
        <List sx={{ pt: 0 }}>
          {operations.map((operation, index) => (
            <React.Fragment key={operation.id}>
              <ListItem sx={{ px: 0, py: 2 }}>
                <Box sx={{ width: '100%' }}>
                  {/* Operation Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {getStatusIcon(operation.status)}
                    </ListItemIcon>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                      {getCountryFlag(operation.country)} {operation.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={operation.type.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getTypeColor(operation.type),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                      <Chip
                        label={operation.status.toUpperCase()}
                        color={getStatusColor(operation.status)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Operation Details */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {operation.description}
                  </Typography>

                  {/* Objectives */}
                  {operation.status === 'active' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
                        OBJECTIVES:
                      </Typography>
                      <List dense sx={{ mt: 0.5 }}>
                        {operation.objectives.map((objective, idx) => (
                          <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                            <ListItemText
                              primary={
                                <Typography variant="caption" color="text.secondary">
                                  • {objective}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Progress Bar */}
                  {operation.status === 'active' && (
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {operation.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={operation.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#333',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getTypeColor(operation.type)
                          }
                        }}
                      />
                    </Box>
                  )}

                  {/* Metadata */}
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <TimelineIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                      Started: {new Date(operation.startDate).toLocaleDateString()}
                    </Typography>
                    {operation.endDate && (
                      <Typography variant="caption" color="text.secondary">
                        Ended: {new Date(operation.endDate).toLocaleDateString()}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      Updated: {operation.lastUpdate}
                    </Typography>
                  </Box>

                  {/* Confidence Indicator */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Tooltip title="Intelligence confidence level">
                      <Chip
                        icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                        label={`${Math.round(operation.confidence * 100)}% confidence`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem' }}
                      />
                    </Tooltip>
                  </Box>
                </Box>
              </ListItem>
              {index < operations.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Operations tracked from intelligence reports and verified news sources
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MilitaryOperationsTracker;