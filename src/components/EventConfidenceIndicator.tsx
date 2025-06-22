/**
 * Event Confidence Indicator Component
 * Shows confidence level and source count for timeline events
 */

import React from 'react';
import { Box, Chip, Tooltip, LinearProgress, Typography } from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  Warning as UnverifiedIcon,
  Source as SourceIcon,
  TrendingUp as HighConfidenceIcon,
} from '@mui/icons-material';

interface EventConfidenceIndicatorProps {
  confidence: number;
  sources: string[];
  verified?: boolean;
}

const EventConfidenceIndicator: React.FC<EventConfidenceIndicatorProps> = ({
  confidence,
  sources,
  verified = false,
}) => {
  const getConfidenceLevel = () => {
    if (confidence >= 0.8) return { label: 'High', color: '#4caf50' };
    if (confidence >= 0.6) return { label: 'Medium', color: '#ff9800' };
    return { label: 'Low', color: '#f44336' };
  };

  const { label, color } = getConfidenceLevel();
  const uniqueSources = Array.from(new Set(sources));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Verification Status */}
      {verified ? (
        <Tooltip title="Cross-verified by multiple sources">
          <Chip
            icon={<VerifiedIcon />}
            label="Verified"
            size="small"
            sx={{
              backgroundColor: '#4caf50',
              color: 'white',
              fontSize: '0.7rem',
              height: 20,
              '& .MuiChip-icon': { fontSize: 16 }
            }}
          />
        </Tooltip>
      ) : (
        <Tooltip title="Single source - awaiting verification">
          <Chip
            icon={<UnverifiedIcon />}
            label="Unverified"
            size="small"
            sx={{
              backgroundColor: '#666',
              color: 'white',
              fontSize: '0.7rem',
              height: 20,
              '& .MuiChip-icon': { fontSize: 16 }
            }}
          />
        </Tooltip>
      )}

      {/* Confidence Level */}
      <Tooltip
        title={
          <Box>
            <Typography variant="caption">Confidence Score</Typography>
            <LinearProgress
              variant="determinate"
              value={confidence * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: '#333',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 3,
                },
              }}
            />
            <Typography variant="caption">
              {Math.round(confidence * 100)}% - {label}
            </Typography>
          </Box>
        }
      >
        <Chip
          icon={<HighConfidenceIcon />}
          label={`${Math.round(confidence * 100)}%`}
          size="small"
          sx={{
            backgroundColor: color,
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
            '& .MuiChip-icon': { fontSize: 16 }
          }}
        />
      </Tooltip>

      {/* Source Count */}
      <Tooltip
        title={
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Sources ({uniqueSources.length}):
            </Typography>
            {uniqueSources.map((source, index) => (
              <Typography key={index} variant="caption" display="block">
                • {source}
              </Typography>
            ))}
          </Box>
        }
      >
        <Chip
          icon={<SourceIcon />}
          label={uniqueSources.length}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.7rem',
            height: 20,
            '& .MuiChip-icon': { fontSize: 16 }
          }}
        />
      </Tooltip>
    </Box>
  );
};

export default EventConfidenceIndicator;