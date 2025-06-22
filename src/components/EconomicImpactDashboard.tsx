import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalGasStation as OilIcon,
  DirectionsBoat as ShipIcon,
  ShowChart as ChartIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Public as GlobalIcon,
} from '@mui/icons-material';
import { economicDataService, EconomicImpact } from '../services/EconomicDataService';

const EconomicImpactDashboard: React.FC = () => {
  const [economicData, setEconomicData] = useState<EconomicImpact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = economicDataService.subscribe((data) => {
      setEconomicData(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading || !economicData) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading economic impact data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string | number) => {
    if (typeof trend === 'string') {
      return trend === 'up' ? <TrendingUpIcon sx={{ fontSize: 16, color: '#f44336' }} /> :
             trend === 'down' ? <TrendingDownIcon sx={{ fontSize: 16, color: '#4caf50' }} /> : null;
    }
    return trend > 0 ? <TrendingUpIcon sx={{ fontSize: 16, color: '#f44336' }} /> :
           trend < 0 ? <TrendingDownIcon sx={{ fontSize: 16, color: '#4caf50' }} /> : null;
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? '#f44336' : change < 0 ? '#4caf50' : '#666';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getDisruptionColor = (disruption: string) => {
    switch (disruption) {
      case 'critical': return 'error';
      case 'severe': return 'error';
      case 'moderate': return 'warning';
      case 'minimal': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MoneyIcon sx={{ mr: 1, color: '#ff5722' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            ECONOMIC IMPACT
          </Typography>
          <Tooltip title="Estimated daily cost to global economy">
            <Chip
              icon={<WarningIcon sx={{ fontSize: 16 }} />}
              label={`$${economicData.globalImpact.estimatedDailyCost}M/day`}
              color="error"
              size="small"
            />
          </Tooltip>
        </Box>

        {/* Global Impact Alert */}
        <Alert 
          severity={economicData.globalImpact.supplyChainDisruption === 'critical' ? 'error' : 'warning'}
          sx={{ mb: 2, fontSize: '0.875rem' }}
          icon={<GlobalIcon />}
        >
          Supply chain disruption: <strong>{economicData.globalImpact.supplyChainDisruption.toUpperCase()}</strong>
          {' • '}
          Inflation pressure: <strong>+{economicData.globalImpact.inflationPressure}%</strong>
        </Alert>

        {/* Oil Prices */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <OilIcon sx={{ mr: 1, fontSize: 20, color: '#ff9800' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              OIL PRICES
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {economicData.oilPrices.map((oil) => (
              <Paper key={oil.type} sx={{ p: 2, backgroundColor: '#1a1a1a' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {oil.type}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
                      ${oil.price}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTrendIcon(oil.trend)}
                      <Typography 
                        variant="body2" 
                        sx={{ color: getChangeColor(oil.change), fontWeight: 600 }}
                      >
                        {oil.change > 0 ? '+' : ''}{oil.change} ({oil.changePercent > 0 ? '+' : ''}{oil.changePercent}%)
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      {oil.lastUpdate}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Shipping Routes */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ShipIcon sx={{ mr: 1, fontSize: 20, color: '#2196f3' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              CRITICAL SHIPPING ROUTES
            </Typography>
          </Box>
          {economicData.shippingRoutes.map((route, index) => (
            <Box key={route.name} sx={{ mb: index < economicData.shippingRoutes.length - 1 ? 2 : 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {route.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={route.status.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: route.status === 'open' ? '#4caf50' : 
                                     route.status === 'restricted' ? '#ff9800' : '#f44336',
                      color: 'white',
                      fontSize: '0.65rem'
                    }}
                  />
                  <Chip
                    label={`Risk: ${route.riskLevel}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: getRiskColor(route.riskLevel),
                      color: getRiskColor(route.riskLevel),
                      fontSize: '0.65rem'
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {route.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Traffic: {route.trafficLevel}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={route.trafficLevel}
                    sx={{
                      width: 100,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: '#333',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: route.trafficLevel > 70 ? '#4caf50' : 
                                       route.trafficLevel > 40 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    Insurance: +{route.insurancePremium}%
                  </Typography>
                  {route.lastIncident && (
                    <Typography variant="caption" sx={{ display: 'block', color: '#ff9800' }}>
                      Incident: {route.lastIncident}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Market Indices */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ChartIcon sx={{ mr: 1, fontSize: 20, color: '#9c27b0' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              MARKET INDICES
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
            {economicData.marketIndices.map((index) => (
              <Box 
                key={index.symbol} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: '#0a0a0a'
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {index.symbol}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {index.value.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getTrendIcon(index.change)}
                    <Typography 
                      variant="caption" 
                      sx={{ color: getChangeColor(index.change), fontWeight: 600 }}
                    >
                      {index.changePercent > 0 ? '+' : ''}{index.changePercent}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Vol: {index.volatility.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Currencies */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            KEY CURRENCIES
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {economicData.currencies.map((currency) => (
              <Chip
                key={currency.pair}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {currency.pair}: {currency.rate}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: getChangeColor(currency.change) }}
                    >
                      ({currency.changePercent > 0 ? '+' : ''}{currency.changePercent}%)
                    </Typography>
                  </Box>
                }
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Economic indicators update in real-time based on conflict developments
        </Typography>
      </CardContent>
    </Card>
  );
};

export default EconomicImpactDashboard;