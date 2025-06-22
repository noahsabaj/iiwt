# Israel-Iran War Tracker - Real-Time Data Sources Configuration

This document explains how to configure real-time data sources for the conflict tracker.

## 📰 News API (Currently Implemented)

### Setup
1. Get a free API key from [NewsAPI.org](https://newsapi.org)
2. Add to your `.env` file:
   ```
   REACT_APP_NEWS_API_KEY=your_api_key_here
   REACT_APP_NEWS_API_URL=https://newsapi.org/v2
   ```
3. For Vercel deployment, add these as environment variables in project settings

### Features
- Real-time news from 150,000+ sources
- Automatic casualty extraction from articles
- Event timeline generation
- Severity analysis
- Multi-language support

### Endpoints Used
- `/top-headlines` - Breaking news
- `/everything` - Comprehensive search

## 🏛️ Government Sources (Partially Implemented)

### Available Sources

#### IAEA (International Atomic Energy Agency)
- **RSS Feed**: `https://www.iaea.org/feeds/topnews.rss`
- **Features**: Nuclear facility status updates
- **No authentication required**

#### UN OCHA ReliefWeb
- **API**: `https://api.reliefweb.int/v1/reports`
- **Features**: Humanitarian data, casualty reports
- **No authentication required**

#### IDF (Israel Defense Forces)
- **RSS**: `https://www.idf.il/en/minisites/press-releases/rss/`
- **Note**: May require proxy due to geo-restrictions

### Implementation Status
- ✅ Service structure created
- ⚠️ CORS proxy needed for browser access
- ⚠️ RSS parsing implemented (needs server-side execution)

## 🔍 OSINT Sources (Configured but API Keys Needed)

### NASA FIRMS (Fire Detection)
- **Purpose**: Detect explosions/strikes via thermal anomalies
- **API**: `https://firms.modaps.eosdis.nasa.gov/api/`
- **Setup**:
  1. Register at [NASA Earthdata](https://urs.earthdata.nasa.gov)
  2. Request FIRMS API key
  3. Add to environment: `REACT_APP_FIRMS_API_KEY=your_key`

### ACLED (Armed Conflict Data)
- **Purpose**: Verified conflict events with coordinates
- **API**: `https://api.acleddata.com/`
- **Setup**:
  1. Register at [ACLED](https://acleddata.com)
  2. Request API access (academic/NGO preferred)
  3. Add to environment:
     ```
     REACT_APP_ACLED_KEY=your_key
     REACT_APP_ACLED_EMAIL=your_email
     ```

### Flight Tracking
- **Flightradar24 API**: Commercial API required
- **Alternative**: ADS-B Exchange API
- **Purpose**: Track military aircraft movements

### Social Media OSINT
- **Twitter/X API v2**: Requires developer account
- **Telegram API**: For monitoring OSINT channels
- **Reddit API**: Public API available

## 🗺️ Interactive Map (Ready for Implementation)

### Recommended Services

#### Mapbox GL JS
```bash
npm install mapbox-gl react-map-gl
```
- Add to environment: `REACT_APP_MAPBOX_TOKEN=your_token`

#### Leaflet (Open Source)
```bash
npm install leaflet react-leaflet
```
- No API key required for OpenStreetMap

### Features to Implement
- Nuclear facility markers
- Strike location heat maps
- Military movement tracking
- Damage assessment overlays

## 🔧 Setting Up a Backend Proxy

Due to CORS restrictions, many sources require a backend proxy:

### Option 1: Express.js Proxy Server
```javascript
// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy configurations
app.use('/api/iaea', createProxyMiddleware({
  target: 'https://www.iaea.org',
  changeOrigin: true,
}));

app.listen(3001);
```

### Option 2: Vercel Serverless Functions
Create `api/proxy/[...path].js`:
```javascript
export default async function handler(req, res) {
  const { path } = req.query;
  const response = await fetch(`https://external-api.com/${path.join('/')}`);
  const data = await response.text();
  res.status(200).send(data);
}
```

### Option 3: Use CORS Proxy Services
- `https://cors-anywhere.herokuapp.com/` (limited)
- `https://api.allorigins.win/` (free)
- Deploy your own CORS proxy

## 📊 Data Processing Pipeline

### Current Implementation
1. **Fetch**: NewsAPI → Process articles
2. **Extract**: Casualties, locations, severity
3. **Generate**: Timeline events, alerts
4. **Update**: Real-time dashboard

### Recommended Enhancements
1. **Verification**: Cross-reference multiple sources
2. **Deduplication**: Remove duplicate events
3. **Translation**: Multi-language support
4. **Caching**: Redis/localStorage for performance
5. **Webhooks**: Real-time push notifications

## 🚀 Production Deployment Checklist

### Environment Variables (Vercel)
- [ ] `REACT_APP_NEWS_API_KEY`
- [ ] `REACT_APP_NEWS_API_URL`
- [ ] `REACT_APP_FIRMS_API_KEY` (optional)
- [ ] `REACT_APP_ACLED_KEY` (optional)
- [ ] `REACT_APP_MAPBOX_TOKEN` (optional)

### Security
- [ ] API keys in environment variables only
- [ ] Rate limiting implemented
- [ ] Error handling for API failures
- [ ] Fallback to cached/demo data

### Performance
- [ ] Implement request caching
- [ ] Batch API requests
- [ ] Use WebSocket for real-time updates
- [ ] Optimize bundle size

## 📝 Adding New Data Sources

To add a new data source:

1. Create service in `/src/services/`
2. Add to `ConflictDataService.fetchLatestData()`
3. Process data in `processYourSourceData()`
4. Update `DataSourceIndicator` component
5. Add environment variables
6. Document in this file

## 🔗 Useful Resources

- [NewsAPI Documentation](https://newsapi.org/docs)
- [ReliefWeb API Guide](https://reliefweb.int/help/api)
- [NASA FIRMS User Guide](https://firms.modaps.eosdis.nasa.gov/usersguide/)
- [ACLED API Documentation](https://acleddata.com/resources/general-guides/)
- [Mapbox GL JS Examples](https://docs.mapbox.com/mapbox-gl-js/example/)

---

**Note**: This tracker aggregates publicly available information. Always verify critical data from multiple sources.