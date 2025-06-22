import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';

const LiveClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: 'UTC',
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  return (
    <Box sx={{ textAlign: 'right', minWidth: 140 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
        {formatTime(currentTime)} UTC
      </Typography>
      <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
        {formatDate(currentTime)}
      </Typography>
    </Box>
  );
};

export default LiveClock;