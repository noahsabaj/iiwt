import React from 'react';
import { 
  Box, 
  Skeleton, 
  Card, 
  CardContent, 
  Paper
} from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'map' | 'news' | 'chart' | 'list';
  count?: number;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  count = 1,
  height = 'auto',
  animation = 'wave'
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} animation={animation} />
              <Skeleton variant="text" width="100%" height={20} animation={animation} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="80%" height={20} animation={animation} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Skeleton variant="text" width="30%" height={16} animation={animation} />
                <Skeleton variant="text" width="20%" height={16} animation={animation} />
              </Box>
            </CardContent>
          </Card>
        );

      case 'map':
        return (
          <Paper sx={{ height: typeof height === 'number' ? `${height}px` : height, p: 2 }}>
            <Skeleton variant="rectangular" width="100%" height="100%" animation={animation} />
            <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
              <Skeleton variant="text" width={100} height={20} animation={animation} />
            </Box>
          </Paper>
        );

      case 'news':
        return (
          <Card sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Skeleton variant="rectangular" width={120} height={80} animation={animation} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="90%" height={24} animation={animation} />
                <Skeleton variant="text" width="100%" height={20} animation={animation} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="70%" height={20} animation={animation} />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Skeleton variant="text" width={60} height={16} animation={animation} />
                  <Skeleton variant="text" width={80} height={16} animation={animation} />
                </Box>
              </Box>
            </Box>
          </Card>
        );

      case 'chart':
        return (
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width="40%" height={24} animation={animation} />
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" width="100%" height={200} animation={animation} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="text" width={50} height={16} animation={animation} />
              ))}
            </Box>
          </Paper>
        );

      case 'list':
        return (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
                <Skeleton variant="circular" width={40} height={40} animation={animation} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} animation={animation} />
                  <Skeleton variant="text" width="40%" height={16} animation={animation} />
                </Box>
                <Skeleton variant="text" width={60} height={16} animation={animation} />
              </Box>
            ))}
          </Box>
        );

      default:
        return (
          <Skeleton 
            variant="text" 
            width="100%" 
            height={height} 
            animation={animation}
          />
        );
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <Box key={index}>
          {renderSkeleton()}
        </Box>
      ))}
    </>
  );
};

// Specialized skeleton components for specific use cases
export const NewsListSkeleton: React.FC = () => (
  <Box>
    {[...Array(6)].map((_, i) => (
      <LoadingSkeleton key={i} variant="news" />
    ))}
  </Box>
);

export const DashboardCardSkeleton: React.FC = () => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
    {[...Array(6)].map((_, i) => (
      <LoadingSkeleton key={i} variant="card" />
    ))}
  </Box>
);

export const MapSkeleton: React.FC = () => (
  <LoadingSkeleton variant="map" height={500} />
);

export const ChartSkeleton: React.FC = () => (
  <LoadingSkeleton variant="chart" />
);

export default LoadingSkeleton;