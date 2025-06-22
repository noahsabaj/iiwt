import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  LocalFireDepartment as ExplosionIcon,
  Flight as MissileIcon,
  Warning as WarningIcon,
  RadioButtonChecked as NuclearIcon,
  Shield as CyberIcon,
  Visibility as IntelligenceIcon,
  Groups as DiplomacyIcon,
  DirectionsRun as EvacuationIcon,
} from '@mui/icons-material';
import { useConflictData } from '../contexts/ConflictDataContext';
import { EVENT_TYPES } from '../constants';
import EventConfidenceIndicator from './EventConfidenceIndicator';
import { TimelineEvent } from '../types';

const ConflictTimeline: React.FC = () => {
  const { data: conflictData } = useConflictData();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

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

  const events = conflictData.timeline || [];

  const filteredEvents = events.filter((event: TimelineEvent) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case EVENT_TYPES.STRIKE: return <ExplosionIcon />;
      case EVENT_TYPES.MISSILE: return <MissileIcon />;
      case EVENT_TYPES.DIPLOMACY: return <DiplomacyIcon />;
      case EVENT_TYPES.EVACUATION: return <EvacuationIcon />;
      case EVENT_TYPES.CASUALTY: return <WarningIcon />;
      case EVENT_TYPES.NUCLEAR: return <NuclearIcon />;
      case EVENT_TYPES.CYBER: return <CyberIcon />;
      case EVENT_TYPES.ALERT: return <WarningIcon />;
      case EVENT_TYPES.INTELLIGENCE: return <IntelligenceIcon />;
      default: return <LocationIcon />;
    }
  };

  const getEventColor = (severity: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  const getTimeAgo = (timestamp: Date | string): string => {
    const now = new Date();
    const eventDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diffMs = now.getTime() - eventDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ScheduleIcon sx={{ mr: 1, color: '#ff9800' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            CONFLICT TIMELINE
          </Typography>
          <Chip
            label={`${events.length} EVENTS`}
            color="warning"
            size="small"
            variant="outlined"
          />
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {filteredEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">
              {searchTerm ? 'No events match your search' : 'No events recorded yet'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
            <Timeline>
              {filteredEvents.map((event: TimelineEvent, index: number) => (
                <TimelineItem key={event.id}>
                  <TimelineSeparator>
                    <TimelineDot color={getEventColor(event.severity)}>
                      {getEventIcon(event.type)}
                    </TimelineDot>
                    {index < filteredEvents.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Accordion
                      expanded={expandedEvent === event.id}
                      onChange={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                      sx={{
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        '&:before': { display: 'none' }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ px: 0, minHeight: 48 }}
                      >
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {event.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={event.severity.toUpperCase()}
                              color={getEventColor(event.severity)}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              📍 {event.location} • {getTimeAgo(event.timestamp)}
                            </Typography>
                          </Box>
                          
                          {/* Confidence and Source Tracking */}
                          {(event.confidence !== undefined || event.metadata?.sources) && (
                            <Box sx={{ mt: 1 }}>
                              <EventConfidenceIndicator
                                confidence={event.confidence || event.metadata?.confidence || 0.5}
                                sources={event.metadata?.sources || [event.source || 'Unknown']}
                                verified={(event.metadata?.sources?.length || 0) > 1}
                              />
                            </Box>
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0, pt: 0 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {event.description}
                        </Typography>
                        
                        {/* Extended Metadata */}
                        {event.metadata && (
                          <Box sx={{ mt: 2, mb: 2 }}>
                            {event.metadata.eventTime && (
                              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                                <strong>Actual Event Time:</strong> {new Date(event.metadata.eventTime).toLocaleString()}
                                {event.metadata.timeConfidence && (
                                  <Chip 
                                    label={`${Math.round(event.metadata.timeConfidence * 100)}% confident`}
                                    size="small"
                                    sx={{ ml: 1, height: 16, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Typography>
                            )}
                            
                            {event.metadata.duplicateCount && (
                              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                                <strong>Similar Reports:</strong> {event.metadata.duplicateCount} other sources
                              </Typography>
                            )}
                            
                            {event.metadata.url && (
                              <Typography variant="caption" display="block">
                                <a 
                                  href={event.metadata.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: '#2196f3' }}
                                >
                                  View Original Article →
                                </a>
                              </Typography>
                            )}
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Primary Source: {event.source || event.metadata?.source || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Published: {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ConflictTimeline;