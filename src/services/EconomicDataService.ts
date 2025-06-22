/**
 * Economic Data Service - Tracks economic impact of the conflict
 * In production, this would connect to real financial APIs
 */

export interface OilPrice {
  type: 'Brent' | 'WTI';
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: string;
  trend: 'up' | 'down' | 'stable';
}

export interface ShippingRoute {
  name: string;
  location: string;
  status: 'open' | 'restricted' | 'closed';
  trafficLevel: number; // 0-100%
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  insurancePremium: number; // percentage
  lastIncident?: string;
  description: string;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  volatility: number; // VIX-like measurement
  lastUpdate: string;
}

export interface CurrencyRate {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  volatility: 'low' | 'medium' | 'high';
}

export interface EconomicImpact {
  oilPrices: OilPrice[];
  shippingRoutes: ShippingRoute[];
  marketIndices: MarketIndex[];
  currencies: CurrencyRate[];
  globalImpact: {
    estimatedDailyCost: number; // in millions USD
    supplyChainDisruption: 'minimal' | 'moderate' | 'severe' | 'critical';
    inflationPressure: number; // percentage points
  };
  lastUpdate: string;
}

class EconomicDataService {
  private data: EconomicImpact;
  private subscribers: ((data: EconomicImpact) => void)[] = [];

  constructor() {
    this.data = this.getInitialData();
    this.startSimulation();
  }

  private getInitialData(): EconomicImpact {
    return {
      oilPrices: [
        {
          type: 'Brent',
          price: 92.45,
          change: 3.21,
          changePercent: 3.6,
          lastUpdate: '2 min ago',
          trend: 'up'
        },
        {
          type: 'WTI',
          price: 88.12,
          change: 2.89,
          changePercent: 3.4,
          lastUpdate: '2 min ago',
          trend: 'up'
        }
      ],
      shippingRoutes: [
        {
          name: 'Strait of Hormuz',
          location: 'Persian Gulf',
          status: 'restricted',
          trafficLevel: 65,
          riskLevel: 'high',
          insurancePremium: 2.8,
          lastIncident: '12 hours ago',
          description: '21% of global oil passes through'
        },
        {
          name: 'Red Sea Route',
          location: 'Bab el-Mandeb',
          status: 'restricted',
          trafficLevel: 45,
          riskLevel: 'critical',
          insurancePremium: 4.2,
          lastIncident: '3 hours ago',
          description: 'Houthi attacks on commercial vessels'
        },
        {
          name: 'Suez Canal',
          location: 'Egypt',
          status: 'open',
          trafficLevel: 78,
          riskLevel: 'medium',
          insurancePremium: 1.5,
          description: '12% of global trade'
        }
      ],
      marketIndices: [
        {
          name: 'Tel Aviv 35',
          symbol: 'TA35',
          value: 1789.32,
          change: -45.21,
          changePercent: -2.47,
          volatility: 32.5,
          lastUpdate: '5 min ago'
        },
        {
          name: 'Tehran Stock Exchange',
          symbol: 'TEDPIX',
          value: 2145678,
          change: -89234,
          changePercent: -3.99,
          volatility: 45.8,
          lastUpdate: '1 hour ago'
        },
        {
          name: 'S&P 500',
          symbol: 'SPX',
          value: 4521.45,
          change: -28.32,
          changePercent: -0.62,
          volatility: 18.4,
          lastUpdate: '1 min ago'
        },
        {
          name: 'Dubai Financial Market',
          symbol: 'DFMGI',
          value: 3456.78,
          change: -67.89,
          changePercent: -1.93,
          volatility: 24.6,
          lastUpdate: '15 min ago'
        }
      ],
      currencies: [
        {
          pair: 'USD/ILS',
          rate: 3.72,
          change: 0.08,
          changePercent: 2.2,
          volatility: 'high'
        },
        {
          pair: 'USD/IRR',
          rate: 42000,
          change: 500,
          changePercent: 1.2,
          volatility: 'high'
        },
        {
          pair: 'EUR/USD',
          rate: 1.0823,
          change: -0.0045,
          changePercent: -0.41,
          volatility: 'medium'
        }
      ],
      globalImpact: {
        estimatedDailyCost: 850, // million USD
        supplyChainDisruption: 'severe',
        inflationPressure: 0.3
      },
      lastUpdate: new Date().toISOString()
    };
  }

  private startSimulation() {
    // Update oil prices every 30 seconds
    setInterval(() => {
      this.updateOilPrices();
    }, 30000);

    // Update market indices every minute
    setInterval(() => {
      this.updateMarketIndices();
    }, 60000);

    // Update shipping routes every 2 minutes
    setInterval(() => {
      this.updateShippingRoutes();
    }, 120000);
  }

  private updateOilPrices() {
    this.data.oilPrices = this.data.oilPrices.map(oil => {
      const changePercent = (Math.random() - 0.5) * 2; // -1% to +1%
      const change = oil.price * (changePercent / 100);
      const newPrice = oil.price + change;
      
      return {
        ...oil,
        price: parseFloat(newPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        lastUpdate: 'Just now'
      };
    });

    this.notifySubscribers();
  }

  private updateMarketIndices() {
    this.data.marketIndices = this.data.marketIndices.map(index => {
      const volatilityFactor = index.volatility / 20; // Higher volatility = bigger swings
      const changePercent = (Math.random() - 0.5) * volatilityFactor;
      const change = index.value * (changePercent / 100);
      const newValue = index.value + change;
      
      return {
        ...index,
        value: parseFloat(newValue.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volatility: index.volatility + (Math.random() - 0.5) * 2,
        lastUpdate: 'Just now'
      };
    });

    // Update global impact based on market conditions
    const avgVolatility = this.data.marketIndices.reduce((sum, idx) => sum + idx.volatility, 0) / this.data.marketIndices.length;
    
    if (avgVolatility > 35) {
      this.data.globalImpact.supplyChainDisruption = 'critical';
      this.data.globalImpact.estimatedDailyCost = 1200;
    } else if (avgVolatility > 25) {
      this.data.globalImpact.supplyChainDisruption = 'severe';
      this.data.globalImpact.estimatedDailyCost = 850;
    } else if (avgVolatility > 15) {
      this.data.globalImpact.supplyChainDisruption = 'moderate';
      this.data.globalImpact.estimatedDailyCost = 450;
    } else {
      this.data.globalImpact.supplyChainDisruption = 'minimal';
      this.data.globalImpact.estimatedDailyCost = 250;
    }

    this.notifySubscribers();
  }

  private updateShippingRoutes() {
    this.data.shippingRoutes = this.data.shippingRoutes.map(route => {
      // Simulate incidents and traffic changes
      const incidentChance = route.riskLevel === 'critical' ? 0.1 : 
                           route.riskLevel === 'high' ? 0.05 : 
                           route.riskLevel === 'medium' ? 0.02 : 0.01;
      
      if (Math.random() < incidentChance) {
        route.lastIncident = 'Just now';
        route.trafficLevel = Math.max(20, route.trafficLevel - 20);
      } else {
        // Gradual recovery
        route.trafficLevel = Math.min(100, route.trafficLevel + 5);
      }

      // Update insurance premiums based on risk
      if (route.lastIncident === 'Just now') {
        route.insurancePremium = Math.min(10, route.insurancePremium + 0.5);
      } else {
        route.insurancePremium = Math.max(0.5, route.insurancePremium - 0.1);
      }

      return route;
    });

    this.notifySubscribers();
  }

  public subscribe(callback: (data: EconomicImpact) => void) {
    this.subscribers.push(callback);
    callback(this.data);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers() {
    this.data.lastUpdate = new Date().toISOString();
    this.subscribers.forEach(callback => callback(this.data));
  }

  public getCurrentData(): EconomicImpact {
    return { ...this.data };
  }

  /**
   * Calculate risk score for shipping insurance
   */
  public calculateShippingRisk(route: string): number {
    const routeData = this.data.shippingRoutes.find(r => r.name === route);
    if (!routeData) return 0;

    const riskFactors = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    const baseRisk = riskFactors[routeData.riskLevel];
    const trafficFactor = (100 - routeData.trafficLevel) / 100;
    const recentIncidentFactor = routeData.lastIncident?.includes('hour') ? 1.5 : 1;

    return baseRisk * (1 + trafficFactor) * recentIncidentFactor;
  }
}

export const economicDataService = new EconomicDataService();