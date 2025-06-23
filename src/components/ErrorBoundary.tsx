import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ErrorOutline as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

interface ErrorStateProps {
  error?: Error | string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  variant?: 'alert' | 'card' | 'inline';
  severity?: 'error' | 'warning' | 'info';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  message = 'Something went wrong',
  onRetry,
  showDetails = false,
  variant = 'alert',
  severity = 'error'
}) => {
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  
  const errorMessage = typeof error === 'string' ? error : error?.message || message;
  const errorStack = typeof error === 'object' && error?.stack;

  const renderContent = () => (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ErrorIcon color={severity} />
        <Typography variant="h6" color={severity}>
          {errorMessage}
        </Typography>
      </Box>
      
      {onRetry && (
        <Button
          variant="contained"
          color={severity}
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mb: 1 }}
        >
          Try Again
        </Button>
      )}
      
      {showDetails && errorStack && (
        <>
          <IconButton
            onClick={() => setDetailsOpen(!detailsOpen)}
            sx={{ p: 0.5 }}
          >
            {detailsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {detailsOpen ? 'Hide' : 'Show'} Details
            </Typography>
          </IconButton>
          
          <Collapse in={detailsOpen}>
            <Box
              sx={{
                mt: 1,
                p: 1,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: 200
              }}
            >
              {errorStack}
            </Box>
          </Collapse>
        </>
      )}
    </>
  );

  if (variant === 'card') {
    return (
      <Card sx={{ textAlign: 'center', p: 2 }}>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        {renderContent()}
      </Box>
    );
  }

  return (
    <Alert severity={severity} sx={{ mb: 2 }}>
      <AlertTitle>Error</AlertTitle>
      {renderContent()}
    </Alert>
  );
};

// Specialized error components
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState
    message="Failed to connect to server. Check your internet connection."
    onRetry={onRetry}
    severity="warning"
    variant="card"
  />
);

export const APIError: React.FC<{ service?: string; onRetry?: () => void }> = ({ 
  service = 'API', 
  onRetry 
}) => (
  <ErrorState
    message={`${service} service is currently unavailable. We'll show demo data instead.`}
    onRetry={onRetry}
    severity="info"
    variant="alert"
  />
);

export const DataError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState
    message="Unable to load data. This may be due to API rate limits or service issues."
    onRetry={onRetry}
    severity="warning"
    variant="inline"
  />
);

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error; retry: () => void }> }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }
      
      return (
        <ErrorState
          error={this.state.error}
          onRetry={this.handleRetry}
          showDetails={process.env.NODE_ENV === 'development'}
          variant="card"
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorState;