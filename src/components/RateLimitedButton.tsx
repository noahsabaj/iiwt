import React from 'react';
import { Button, ButtonProps, Tooltip, CircularProgress } from '@mui/material';
import { useRateLimiter } from '../hooks/useRateLimiter';

interface RateLimitedButtonProps extends ButtonProps {
  rateLimitOptions?: {
    maxRequests?: number;
    windowMs?: number;
  };
  onRateLimitReached?: () => void;
  loading?: boolean;
}

export const RateLimitedButton: React.FC<RateLimitedButtonProps> = ({
  onClick,
  rateLimitOptions = { maxRequests: 5, windowMs: 60000 }, // 5 clicks per minute default
  onRateLimitReached,
  loading = false,
  disabled,
  children,
  ...buttonProps
}) => {
  const { isLimited, executeWithLimit, getRemainingRequests, getResetTime } = useRateLimiter({
    maxRequests: rateLimitOptions.maxRequests || 5,
    windowMs: rateLimitOptions.windowMs || 60000,
    onLimitReached: onRateLimitReached
  });

  const handleClick = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        await executeWithLimit(onClick)(event);
      }
    },
    [onClick, executeWithLimit]
  );

  const resetTime = getResetTime();
  const remainingRequests = getRemainingRequests();

  const tooltipTitle = isLimited 
    ? `Rate limit reached. Try again ${resetTime ? `at ${resetTime.toLocaleTimeString()}` : 'later'}`
    : remainingRequests < 3 
    ? `${remainingRequests} requests remaining`
    : '';

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <Button
          {...buttonProps}
          onClick={handleClick}
          disabled={disabled || isLimited || loading}
        >
          {loading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Loading...
            </>
          ) : (
            children
          )}
        </Button>
      </span>
    </Tooltip>
  );
};