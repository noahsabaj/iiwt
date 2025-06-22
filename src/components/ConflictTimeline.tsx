import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  location: string;
  type: 'strike' | 'missile' | 'diplomacy' | 'evacuation' | 'casualty';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

const ConflictTimeline: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([
    {
      id: '1',
      timestamp: new Date('2025-06-22T10:30:00Z'),
      title: 'US Strikes Iranian Nuclear Sites',
      description: 'United States launches offensive strikes on three Iranian nuclear facilities as Trump administration escalates involvement.',
      location: 'Multiple locations, Iran',
      type: 'strike',
      severity: 'critical',
      source: 'CNN'
    },
    {
      id: '2',
      timestamp: new Date('2025-06-21T18:45:00Z'),
      title: 'Houthis Fire Missiles at Israel',
      description: 'Yemen\'s Houthis launch several missiles towards Israeli territory in response to US strikes on Iran.',
      location: 'Yemen → Israel',
      type: 'missile',
      severity: 'high',
      source: 'Reuters'
    },
    {
      id: '3',
      timestamp: new Date('2025-06-21T14:20:00Z'),
      title: 'Iranian Missiles Hit Tel Aviv Buildings',
      description: 'Iranian missile strikes residential buildings in Tel Aviv, wounding 240 people and causing extensive damage.',
      location: 'Tel Aviv, Israel',
      type: 'missile',
      severity: 'critical',
      source: 'AP News'
    },
    {
      id: '4',
      timestamp: new Date('2025-06-20T09:15:00Z'),
      title: 'Hospital Strike in Southern Israel',
      description: 'Iranian missiles strike a major hospital in southern Israel, causing multiple casualties.',
      location: 'Southern Israel',
      type: 'strike',
      severity: 'critical',
      source: 'BBC'
    },
    {
      id: '5',
      timestamp: new Date('2025-06-19T16:30:00Z'),
      title: 'UN Warning on Natanz Contamination',
      description: 'UN nuclear watchdog warns of radiological and chemical contamination at Iran\'s Natanz nuclear facility.',
      location: 'Natanz, Iran',
      type: 'evacuation',
      severity: 'high',
      source: 'IAEA'
    },
    {
      id: '6',
      timestamp: new Date('2025-06-18T12:00:00Z'),
      title: 'Arak Reactor Evacuated Before Strike',
      description: 'Iran evacuates personnel from Arak heavy water reactor before Israeli attack. No radiation danger reported.',
      location: 'Arak, Iran',
      type: 'evacuation',
      severity: 'medium',
      source: 'Iranian State TV'
    },
    {
      id: '7',
      timestamp: new Date('2025-06-13T00:00:00Z'),
      title: 'Operation Rising Lion Begins',
      description: 'Israel launches surprise attack "Operation Rising Lion" targeting key Iranian military and nuclear facilities, marking the beginning of armed conflict.',
      location: 'Iran',
      type: 'strike',
      severity: 'critical',
      source: 'IDF'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'strike': return <ExplosionIcon />;
      case 'missile': return <MissileIcon />;
      case 'diplomacy': return <ScheduleIcon />;
      case 'evacuation': return <WarningIcon />;
      case 'casualty': return <WarningIcon />;
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

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than 1 hour ago';
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

        <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
          <Timeline>
            {filteredEvents.map((event, index) => (
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
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pt: 0 }}>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {event.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Source: {event.source}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.timestamp.toLocaleString()}
                        </Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ConflictTimeline;