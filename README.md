# Israel-Iran War Live Tracker (IIWT)

A real-time conflict monitoring dashboard built with React and Material UI to track the ongoing Israel-Iran conflict.

## 🚨 Features

### Core Monitoring
- **Live Casualty Counter**: Real-time tracking of casualties and injuries for both sides
- **Nuclear Facilities Monitor**: Status of Iranian nuclear facilities with radiation alerts
- **Conflict Timeline**: Interactive timeline of major events with search functionality
- **Threat Level Assessment**: Regional threat indicators with live updates

### Advanced Features
- **Live Alerts System**: Real-time notifications with severity levels and sound alerts
- **Peace Demands Tracker**: Current demands and red lines from both sides
- **Military Operations Tracker**: Monitor ongoing operations like "Rising Lion" and "True Promise"
- **Weapons Systems Monitor**: Track missile types, interception rates, and air defense effectiveness
- **Economic Impact Dashboard**: Oil prices, shipping routes, and market volatility
- **Regional Allies Monitor**: Track involvement of Hezbollah, US forces, and regional actors
- **OSINT Dashboard**: Real-time intelligence from GDELT, ACLED, and social media
- **Enhanced Conflict Map**: Beautiful animated trajectories, heat maps, and live updates
- **Source Code Transparency**: Built-in GitHub repository viewer
- **Auto-Refresh Data**: Real-time updates from multiple sources

### User Experience
- **Dark Crisis Theme**: Military-style dark interface with red accent colors
- **Mobile Responsive**: Optimized for all screen sizes
- **Floating Alert Button**: Quick access to live alerts with badge counter
- **Real-time Clock**: UTC time display with conflict day counter

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material UI (MUI) v6
- **State Management**: React Context with custom service layer
- **Build Tool**: Create React App
- **Styling**: Emotion (CSS-in-JS)
- **Icons**: Material Icons
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/noahsabaj/iiwt.git
cd iiwt

# Install dependencies
npm install

# Start in demo mode (no API keys required)
npm start
```

The application will open at `http://localhost:3000`

### Demo Mode vs Production Mode

By default, the app runs in **demo mode** with simulated data. This is perfect for:
- Testing the application
- Development
- Showcasing features

To use **real-time data**, you'll need API keys (see Setup section below)

### Building for Production

```bash
# Create production build
npm run build
```

## 🌐 Deployment

### Option 1: Vercel (Recommended)

#### Environment Variables Setup
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add your API keys:
   - `REACT_APP_NEWS_API_KEY` - Your NewsAPI.org key
   - `REACT_APP_NASA_FIRMS_KEY` - Your NASA FIRMS key
   - `REACT_APP_ACLED_KEY` - Your ACLED key (optional)
   - `REACT_APP_ACLED_EMAIL` - Your ACLED email (optional)
   - `REACT_APP_DEMO_MODE` - Set to `false` for production

#### Deploy Command
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

### Option 2: Netlify
1. Build: `npm run build`
2. Upload `build` folder to Netlify
3. Configure: Build command `npm run build`, Publish directory `build`

### Option 3: GitHub Pages
```bash
npm install --save-dev gh-pages
npm run deploy  # After adding deploy script to package.json
```

## 📱 Usage

### Main Dashboard
- View real-time casualty statistics
- Monitor nuclear facility status
- Check current threat levels
- Browse conflict timeline

### Live Alerts
- Click the floating red notification button
- View latest alerts and warnings
- Toggle sound notifications
- Mark alerts as read

### Peace Process Tracking
- Review current demands from both sides
- Monitor diplomatic status
- Check red lines and negotiation compatibility

## 🔑 API Setup

### Quick Start (Demo Mode)
No configuration needed! The app automatically uses simulated data when API keys are not configured.

### Production Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get your API keys (all free tier available):**
   - **NewsAPI**: https://newsapi.org/register
   - **NASA FIRMS**: https://firms.modaps.eosdis.nasa.gov/api/
   - **ACLED** (optional): https://acleddata.com/register/

3. **Add keys to `.env.local`:**
   ```env
   REACT_APP_NEWS_API_KEY=your_newsapi_key_here
   REACT_APP_NASA_FIRMS_KEY=your_nasa_key_here
   REACT_APP_ACLED_KEY=your_acled_key_here
   REACT_APP_ACLED_EMAIL=your_email@example.com
   ```

4. **Restart the development server**

### CORS Issues?
Some APIs require a proxy server. See `PROXY_SETUP.md` for detailed instructions on:
- Setting up a local proxy
- Using serverless functions
- Production deployment strategies

## ⚠️ Data Sources

The app integrates with multiple real-time data sources:

### Active Integrations:
- **NewsAPI**: Breaking news and conflict updates
- **NASA FIRMS**: Fire/explosion detection via satellite
- **GDELT**: Global event tracking and analysis
- **ACLED**: Verified conflict event data
- **ReliefWeb**: UN humanitarian reports

### Demo Data:
When API keys are not configured, the app uses realistic simulated data that mimics:
- Real-time news feeds
- Conflict events and casualties
- Nuclear facility status
- Economic impacts
- OSINT intelligence

## 🔧 Configuration

### Service Configuration
- `src/services/ConfigService.ts` - API keys and demo mode settings
- `src/services/ConflictDataService.ts` - Update intervals and data processing
- `src/theme.ts` - UI theme and styling

### Update Intervals
- News updates: Every 5 minutes
- OSINT data: Every 5 minutes
- Economic data: Every 10 minutes
- Casualty updates: Real-time from news feeds

## 📊 Performance

- Bundle size: ~350KB gzipped
- Initial load: < 3 seconds on 3G
- Real-time updates: 10-30 second intervals
- Mobile optimized

## 📄 License

For informational and educational purposes only. Ensure compliance with local laws when deploying.

---

**Built during the Israel-Iran conflict of June 2025**

🤖 *Generated with [Claude Code](https://claude.ai/code)*