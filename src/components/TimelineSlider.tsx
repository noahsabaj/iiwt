import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  IconButton,
  Chip,
  Button,
  Tooltip,
  useTheme,
  alpha,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipPrevious as PrevIcon,
  SkipNext as NextIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Event as EventIcon
} from '@mui/icons-material';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'news' | 'military' | 'diplomatic' | 'economic';
  description?: string;
}

interface TimelineSliderProps {
  events: TimelineEvent[];
  onTimeChange: (timestamp: Date) => void;
  onEventSelect?: (event: TimelineEvent) => void;
  startDate?: Date;
  endDate?: Date;
  autoPlay?: boolean;
  showEventMarkers?: boolean;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  events,
  onTimeChange,
  onEventSelect,
  startDate,
  endDate,
  autoPlay = false,
  showEventMarkers = true
}) => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(startDate || new Date());
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x speed
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const minTime = startDate || (events.length > 0 ? new Date(Math.min(...events.map(e => e.timestamp.getTime()))) : new Date());
  const maxTime = endDate || (events.length > 0 ? new Date(Math.max(...events.map(e => e.timestamp.getTime()))) : new Date());
  const totalDuration = maxTime.getTime() - minTime.getTime();

  // Convert timestamp to slider value (0-100)
  const timeToValue = useCallback((time: Date) => {
    if (totalDuration === 0) return 0;
    return ((time.getTime() - minTime.getTime()) / totalDuration) * 100;
  }, [minTime, maxTime, totalDuration]);

  // Convert slider value to timestamp
  const valueToTime = useCallback((value: number) => {
    return new Date(minTime.getTime() + (value / 100) * totalDuration);
  }, [minTime, totalDuration]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const nextTime = new Date(prev.getTime() + (1000 * 60 * 60 * playbackSpeed)); // 1 hour per step * speed
        if (nextTime >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return nextTime;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, maxTime]);

  // Notify parent of time changes
  useEffect(() => {
    onTimeChange(currentTime);
  }, [currentTime, onTimeChange]);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    const newTime = valueToTime(value);
    setCurrentTime(newTime);
    
    // Find closest event to current time
    const closestEvent = events.reduce((closest, event) => {
      const eventDistance = Math.abs(event.timestamp.getTime() - newTime.getTime());
      const closestDistance = Math.abs(closest.timestamp.getTime() - newTime.getTime());
      return eventDistance < closestDistance ? event : closest;
    }, events[0]);

    if (closestEvent && onEventSelect) {
      setSelectedEvent(closestEvent);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const jumpToEvent = (event: TimelineEvent) => {
    setCurrentTime(event.timestamp);
    setSelectedEvent(event);
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  const jumpToPrevEvent = () => {
    const prevEvents = events
      .filter(e => e.timestamp < currentTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (prevEvents.length > 0) {
      jumpToEvent(prevEvents[0]);
    }
  };

  const jumpToNextEvent = () => {
    const nextEvents = events
      .filter(e => e.timestamp > currentTime)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (nextEvents.length > 0) {
      jumpToEvent(nextEvents[0]);
    }
  };

  const cycleSpeed = () => {
    setPlaybackSpeed(prev => {
      switch (prev) {
        case 1: return 2;
        case 2: return 4;
        case 4: return 0.5;
        default: return 1;
      }
    });
  };

  const getSeverityColor = (severity: TimelineEvent['severity']) => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
    }
  };

  const getEventMarks = () => {
    return events.map(event => ({
      value: timeToValue(event.timestamp),
      label: '',
      event
    }));
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon />
            Timeline Control
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<SpeedIcon />}
              label={`${playbackSpeed}x`}
              onClick={cycleSpeed}
              variant="outlined"
              size="small"
            />
            <Chip
              icon={<EventIcon />}
              label={`${events.length} events`}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>

        {/* Current Time Display */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5" color="primary">
            {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
          </Typography>
          {selectedEvent && (
            <Chip
              label={selectedEvent.title}
              color={selectedEvent.severity === 'critical' ? 'error' : 
                     selectedEvent.severity === 'high' ? 'warning' : 'primary'}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={timeToValue(currentTime)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              }
            }}
          />
        </Box>

        {/* Timeline Slider */}
        <Box sx={{ px: 2, mb: 3 }}>
          <Slider
            value={timeToValue(currentTime)}
            onChange={handleSliderChange}
            min={0}
            max={100}
            step={0.1}
            marks={showEventMarkers ? getEventMarks().map(mark => ({
              value: mark.value,
              label: (
                <Tooltip title={`${mark.event.title} - ${mark.event.timestamp.toLocaleString()}`}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: getSeverityColor(mark.event.severity),
                      cursor: 'pointer'
                    }}
                    onClick={() => jumpToEvent(mark.event)}
                  />
                </Tooltip>
              )
            })) : undefined}
            sx={{
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
              },
              '& .MuiSlider-track': {
                height: 6,
              },
              '& .MuiSlider-rail': {
                height: 6,
              }
            }}
          />
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton onClick={jumpToPrevEvent} disabled={events.length === 0}>
            <PrevIcon />
          </IconButton>
          
          <IconButton
            onClick={togglePlayback}
            color="primary"
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          
          <IconButton onClick={jumpToNextEvent} disabled={events.length === 0}>
            <NextIcon />
          </IconButton>
        </Box>

        {/* Time Range Display */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {minTime.toLocaleDateString()}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setCurrentTime(minTime)}
            >
              Start
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setCurrentTime(new Date())}
            >
              Now
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setCurrentTime(maxTime)}
            >
              End
            </Button>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            {maxTime.toLocaleDateString()}
          </Typography>
        </Box>

        {/* Recent Events List */}
        {events.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Recent Events
            </Typography>
            <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
              {events
                .filter(e => e.timestamp <= currentTime)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 5)
                .map(event => (
                  <Box
                    key={event.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedEvent?.id === event.id ? 
                        alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                    onClick={() => jumpToEvent(event)}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getSeverityColor(event.severity),
                      }}
                    />
                    <Typography variant="caption" sx={{ flex: 1 }}>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {event.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                ))
              }
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineSlider;