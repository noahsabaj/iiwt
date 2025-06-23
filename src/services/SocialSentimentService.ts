/**
 * Social Media Sentiment Analysis Service
 * Tracks public sentiment from social media platforms
 * In production, this would integrate with Twitter API v2, Telegram API, etc.
 */

export interface SentimentData {
  platform: 'Twitter' | 'Telegram' | 'Reddit' | 'Facebook';
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number; // -1 to 1
  volume: number; // Number of posts analyzed
  trending: boolean;
  lastUpdate: string;
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  change: number; // Percentage change
  hashtags: string[];
  platform: string;
}

export interface KeyInfluencer {
  username: string;
  platform: string;
  followers: number;
  stance: 'pro-israel' | 'pro-iran' | 'neutral' | 'peace-advocate';
  recentPost: string;
  engagement: number;
  verified: boolean;
}

export interface SentimentSnapshot {
  overallSentiment: {
    score: number;
    label: 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive';
    confidence: number;
  };
  platformBreakdown: SentimentData[];
  trendingTopics: TrendingTopic[];
  keyInfluencers: KeyInfluencer[];
  emotionalBreakdown: {
    anger: number;
    fear: number;
    sadness: number;
    joy: number;
    surprise: number;
  };
  narratives: {
    theme: string;
    prevalence: number;
    sentiment: string;
    examplePosts: string[];
  }[];
  misinformationAlerts: {
    claim: string;
    spread: number;
    debunked: boolean;
    source: string;
  }[];
  timestamp: string;
}

class SocialSentimentService {
  private currentSnapshot: SentimentSnapshot;
  private subscribers: ((data: SentimentSnapshot) => void)[] = [];
  private updateInterval: number = 60000; // 1 minute

  constructor() {
    this.currentSnapshot = this.generateInitialSnapshot();
    this.startSimulation();
  }

  private generateInitialSnapshot(): SentimentSnapshot {
    return {
      overallSentiment: {
        score: -0.42,
        label: 'negative',
        confidence: 0.78
      },
      platformBreakdown: [
        {
          platform: 'Twitter',
          sentiment: 'negative',
          score: -0.38,
          volume: 125000,
          trending: true,
          lastUpdate: '2 min ago'
        },
        {
          platform: 'Telegram',
          sentiment: 'negative',
          score: -0.52,
          volume: 45000,
          trending: true,
          lastUpdate: '5 min ago'
        },
        {
          platform: 'Reddit',
          sentiment: 'mixed',
          score: -0.15,
          volume: 8500,
          trending: false,
          lastUpdate: '10 min ago'
        },
        {
          platform: 'Facebook',
          sentiment: 'negative',
          score: -0.41,
          volume: 65000,
          trending: true,
          lastUpdate: '3 min ago'
        }
      ],
      trendingTopics: [
        {
          topic: '#StopTheWar',
          mentions: 45000,
          sentiment: 'neutral',
          change: 125,
          hashtags: ['#StopTheWar', '#Peace', '#CeasefireNow'],
          platform: 'Twitter'
        },
        {
          topic: 'Nuclear Facilities',
          mentions: 32000,
          sentiment: 'negative',
          change: 89,
          hashtags: ['#NuclearThreat', '#Natanz', '#IAEA'],
          platform: 'Twitter'
        },
        {
          topic: 'Civilian Casualties',
          mentions: 28000,
          sentiment: 'negative',
          change: 67,
          hashtags: ['#CivilianCasualties', '#WarCrimes', '#HumanRights'],
          platform: 'Twitter'
        },
        {
          topic: 'Iron Dome',
          mentions: 21000,
          sentiment: 'positive',
          change: 45,
          hashtags: ['#IronDome', '#Defense', '#Protection'],
          platform: 'Twitter'
        },
        {
          topic: 'Oil Prices',
          mentions: 18000,
          sentiment: 'negative',
          change: 34,
          hashtags: ['#OilPrices', '#Economy', '#Inflation'],
          platform: 'Twitter'
        }
      ],
      keyInfluencers: [
        {
          username: '@MiddleEastEye',
          platform: 'Twitter',
          followers: 1200000,
          stance: 'neutral',
          recentPost: 'BREAKING: Multiple explosions reported in Tehran...',
          engagement: 45000,
          verified: true
        },
        {
          username: '@IDF',
          platform: 'Twitter',
          followers: 890000,
          stance: 'pro-israel',
          recentPost: 'Iron Dome successfully intercepted incoming threats...',
          engagement: 38000,
          verified: true
        },
        {
          username: '@PressTV',
          platform: 'Twitter',
          followers: 750000,
          stance: 'pro-iran',
          recentPost: 'Iranian air defenses activated in response to...',
          engagement: 28000,
          verified: true
        },
        {
          username: '@UN_News',
          platform: 'Twitter',
          followers: 3500000,
          stance: 'peace-advocate',
          recentPost: 'UN Secretary-General calls for immediate de-escalation...',
          engagement: 62000,
          verified: true
        }
      ],
      emotionalBreakdown: {
        anger: 0.35,
        fear: 0.42,
        sadness: 0.28,
        joy: 0.05,
        surprise: 0.15
      },
      narratives: [
        {
          theme: 'Self-defense narrative',
          prevalence: 0.32,
          sentiment: 'mixed',
          examplePosts: [
            'Every nation has the right to defend itself against threats',
            'Preemptive strikes are necessary when facing existential threats'
          ]
        },
        {
          theme: 'Humanitarian crisis',
          prevalence: 0.28,
          sentiment: 'negative',
          examplePosts: [
            'Innocent civilians are paying the price for political conflicts',
            'The humanitarian situation is deteriorating rapidly'
          ]
        },
        {
          theme: 'Regional stability concerns',
          prevalence: 0.25,
          sentiment: 'negative',
          examplePosts: [
            'This conflict could engulf the entire Middle East',
            'Worried about the spillover effects on neighboring countries'
          ]
        },
        {
          theme: 'Call for diplomacy',
          prevalence: 0.15,
          sentiment: 'positive',
          examplePosts: [
            'Diplomacy is the only solution to this crisis',
            'International mediation needed now more than ever'
          ]
        }
      ],
      misinformationAlerts: [
        {
          claim: 'Nuclear reactor meltdown in progress',
          spread: 15000,
          debunked: true,
          source: 'Unverified social media accounts'
        },
        {
          claim: 'Foreign troops deployed on the ground',
          spread: 8500,
          debunked: false,
          source: 'Telegram channels'
        },
        {
          claim: 'Casualty numbers inflated by 10x',
          spread: 5200,
          debunked: true,
          source: 'Facebook groups'
        }
      ],
      timestamp: new Date().toISOString()
    };
  }

  private startSimulation() {
    setInterval(() => {
      this.updateSentiment();
      this.notifySubscribers();
    }, this.updateInterval);
  }

  private updateSentiment() {
    // Update overall sentiment
    const sentimentDrift = (Math.random() - 0.5) * 0.1;
    this.currentSnapshot.overallSentiment.score = Math.max(-1, Math.min(1, 
      this.currentSnapshot.overallSentiment.score + sentimentDrift
    ));
    
    this.currentSnapshot.overallSentiment.label = this.getSentimentLabel(
      this.currentSnapshot.overallSentiment.score
    );

    // Update platform breakdowns
    this.currentSnapshot.platformBreakdown = this.currentSnapshot.platformBreakdown.map(platform => ({
      ...platform,
      score: Math.max(-1, Math.min(1, platform.score + (Math.random() - 0.5) * 0.15)),
      volume: Math.floor(platform.volume * (0.9 + Math.random() * 0.2)),
      lastUpdate: this.getTimeAgo(Math.floor(Math.random() * 10))
    }));

    // Update trending topics
    this.currentSnapshot.trendingTopics = this.currentSnapshot.trendingTopics.map(topic => ({
      ...topic,
      mentions: Math.floor(topic.mentions * (0.8 + Math.random() * 0.4)),
      change: Math.floor((Math.random() - 0.5) * 100)
    }));

    // Shuffle and update some topics
    if (Math.random() > 0.7) {
      const newTopics = [
        {
          topic: 'Hezbollah Response',
          mentions: Math.floor(15000 + Math.random() * 10000),
          sentiment: 'negative' as const,
          change: Math.floor(Math.random() * 100),
          hashtags: ['#Hezbollah', '#Lebanon', '#RegionalConflict'],
          platform: 'Twitter'
        },
        {
          topic: 'US Military Movement',
          mentions: Math.floor(12000 + Math.random() * 8000),
          sentiment: 'mixed' as const,
          change: Math.floor(Math.random() * 80),
          hashtags: ['#USMilitary', '#Pentagon', '#MiddleEast'],
          platform: 'Twitter'
        }
      ];
      
      this.currentSnapshot.trendingTopics = [
        ...this.currentSnapshot.trendingTopics.slice(0, 3),
        ...newTopics
      ].sort((a, b) => b.mentions - a.mentions).slice(0, 5);
    }

    // Update emotional breakdown
    const emotions = ['anger', 'fear', 'sadness', 'joy', 'surprise'];
    emotions.forEach(emotion => {
      const key = emotion as keyof typeof this.currentSnapshot.emotionalBreakdown;
      this.currentSnapshot.emotionalBreakdown[key] = Math.max(0, Math.min(1,
        this.currentSnapshot.emotionalBreakdown[key] + (Math.random() - 0.5) * 0.1
      ));
    });

    // Update influencer engagement
    this.currentSnapshot.keyInfluencers = this.currentSnapshot.keyInfluencers.map(influencer => ({
      ...influencer,
      engagement: Math.floor(influencer.engagement * (0.8 + Math.random() * 0.4))
    }));

    this.currentSnapshot.timestamp = new Date().toISOString();
  }

  private getSentimentLabel(score: number): 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive' {
    if (score < -0.6) return 'very negative';
    if (score < -0.2) return 'negative';
    if (score < 0.2) return 'neutral';
    if (score < 0.6) return 'positive';
    return 'very positive';
  }

  private getTimeAgo(minutes: number): string {
    if (minutes === 0) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} min ago`;
  }

  public subscribe(callback: (data: SentimentSnapshot) => void) {
    this.subscribers.push(callback);
    callback(this.currentSnapshot);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.currentSnapshot));
  }

  public getCurrentSnapshot(): SentimentSnapshot {
    return { ...this.currentSnapshot };
  }

  /**
   * Analyze sentiment for a specific topic
   */
  public analyzeTopicSentiment(topic: string): {
    sentiment: number;
    volume: number;
    trend: 'rising' | 'falling' | 'stable';
  } {
    // Simulate topic-specific analysis
    const trending = this.currentSnapshot.trendingTopics.find(t => 
      t.topic.toLowerCase().includes(topic.toLowerCase())
    );

    if (trending) {
      return {
        sentiment: trending.sentiment === 'positive' ? 0.5 : 
                  trending.sentiment === 'negative' ? -0.5 : 0,
        volume: trending.mentions,
        trend: trending.change > 10 ? 'rising' : 
               trending.change < -10 ? 'falling' : 'stable'
      };
    }

    return {
      sentiment: this.currentSnapshot.overallSentiment.score,
      volume: Math.floor(Math.random() * 5000),
      trend: 'stable'
    };
  }

  /**
   * Get historical sentiment data
   */
  public getHistoricalSentiment(hours: number = 24): {
    timestamp: string;
    sentiment: number;
    volume: number;
  }[] {
    const dataPoints = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      dataPoints.push({
        timestamp: timestamp.toISOString(),
        sentiment: -0.3 + Math.sin(i / 4) * 0.2 + (Math.random() - 0.5) * 0.1,
        volume: 80000 + Math.sin(i / 6) * 20000 + Math.random() * 10000
      });
    }

    return dataPoints;
  }
}

export const socialSentimentService = new SocialSentimentService();