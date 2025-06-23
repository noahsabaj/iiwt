import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormControlLabel,
  Paper,
} from '@mui/material';
import {
  Map as MapIcon,
  Layers as LayersIcon,
  MyLocation as LocationIcon,
  LocalFireDepartment as FireIcon,
  GpsFixed as TargetIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useConflictData } from '../contexts/ConflictDataContext';
import { osintService } from '../services/OSINTService';
import { NUCLEAR_FACILITIES, MAP_DEFAULTS } from '../constants';
import { TimelineEvent, Facility } from '../types';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Enhanced custom icons with animations
const createAnimatedIcon = (color: string, symbol: string, isAnimated: boolean = false) => L.divIcon({
  html: `<div class="${isAnimated ? 'animated-marker' : ''}" style="
    background-color: ${color};
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    font-size: 16px;
    position: relative;
  ">
    ${symbol}
    ${isAnimated ? `<div class="pulse-ring" style="
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid ${color};
      animation: pulse 2s infinite;
    "></div>` : ''}
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  className: 'custom-div-icon',
});

const facilityIcon = createAnimatedIcon('#ff9800', '☢️');
const activeStrikeIcon = createAnimatedIcon('#f44336', '💥', true);
const strikeIcon = createAnimatedIcon('#f44336', '💥');
const cityIcon = createAnimatedIcon('#2196f3', '🏙️');
const missileIcon = createAnimatedIcon('#ff5722', '🚀', true);

// Animated trajectory component
interface AnimatedTrajectoryProps {
  start: [number, number];
  end: [number, number];
  duration: number;
  color?: string;
  type?: 'missile' | 'aircraft' | 'drone';
}

const AnimatedTrajectory: React.FC<AnimatedTrajectoryProps> = ({ start, end, duration, color = '#ff5722', type = 'missile' }) => {
  const map = useMap();
  const [progress, setProgress] = useState(0);
  const trajectoryRef = useRef<L.Polyline | null>(null);
  const missileMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(elapsed / duration, 1);
      setProgress(currentProgress);

      if (currentProgress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();

    return () => {
      if (trajectoryRef.current) {
        map.removeLayer(trajectoryRef.current);
      }
      if (missileMarkerRef.current) {
        map.removeLayer(missileMarkerRef.current);
      }
    };
  }, [start, end, duration, map]);

  useEffect(() => {
    // Calculate current position
    const lat = start[0] + (end[0] - start[0]) * progress;
    const lng = start[1] + (end[1] - start[1]) * progress;

    // Draw trajectory trail
    if (trajectoryRef.current) {
      map.removeLayer(trajectoryRef.current);
    }

    const points: [number, number][] = [];
    for (let i = 0; i <= progress * 100; i++) {
      const p = i / 100;
      const pLat = start[0] + (end[0] - start[0]) * p;
      const pLng = start[1] + (end[1] - start[1]) * p;
      // Add arc to trajectory
      const arcHeight = Math.sin(p * Math.PI) * 2;
      points.push([pLat + arcHeight * 0.01, pLng]);
    }

    trajectoryRef.current = L.polyline(points, {
      color,
      weight: 3,
      opacity: 0.8,
      dashArray: type === 'missile' ? undefined : '10, 10',
    }).addTo(map);

    // Update missile marker position
    if (missileMarkerRef.current) {
      map.removeLayer(missileMarkerRef.current);
    }

    if (progress < 1) {
      missileMarkerRef.current = L.marker([lat, lng], { icon: missileIcon }).addTo(map);
    } else {
      // Create explosion effect at the end
      const explosionCircle = L.circle([end[0], end[1]], {
        color: '#ff0000',
        fillColor: '#ff5722',
        fillOpacity: 0.5,
        radius: 5000,
      }).addTo(map);

      setTimeout(() => {
        map.removeLayer(explosionCircle);
      }, 1000);
    }
  }, [progress, start, end, color, type, map]);

  return null;
};

// Heat map layer for conflict intensity
const HeatMapLayer: React.FC<{ hotspots: any[] }> = ({ hotspots }) => {
  const map = useMap();

  useEffect(() => {
    const heatData = hotspots.map(spot => ({
      lat: spot.lat,
      lng: spot.lng,
      intensity: spot.intensity / 100,
    }));

    // Create gradient circles for heat effect
    const heatLayers = heatData.map(point => {
      return L.circle([point.lat, point.lng], {
        color: 'transparent',
        fillColor: '#ff0000',
        fillOpacity: point.intensity * 0.5,
        radius: 50000 * point.intensity,
        weight: 0,
      });
    });

    heatLayers.forEach(layer => layer.addTo(map));

    return () => {
      heatLayers.forEach(layer => map.removeLayer(layer));
    };
  }, [hotspots, map]);

  return null;
};

const EnhancedConflictMap: React.FC = () => {
  const { data: conflictData } = useConflictData();
  const [mapLayer, setMapLayer] = useState<'satellite' | 'terrain' | 'dark'>('satellite');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [osintData, setOsintData] = useState<any>(null);

  // Fetch OSINT data for hotspots
  useEffect(() => {
    const fetchOSINT = async () => {
      const data = await osintService.gatherIntelligence();
      setOsintData(data);
    };
    fetchOSINT();
    const interval = setInterval(fetchOSINT, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Get active missile/drone events from timeline for trajectory display
  const getActiveTrajectories = (): AnimatedTrajectoryProps[] => {
    if (!conflictData) return [];
    
    const trajectories: AnimatedTrajectoryProps[] = [];
    const now = new Date().getTime();
    
    // Look for recent missile/drone events in the timeline
    conflictData.timeline.slice(0, 10).forEach((event) => {
      const eventAge = now - new Date(event.timestamp).getTime();
      const isRecent = eventAge < 3600000; // Within last hour
      
      // Check if event mentions missile or drone strike
      const lowerTitle = event.title.toLowerCase();
      const lowerDesc = (event.description || '').toLowerCase();
      const text = lowerTitle + ' ' + lowerDesc;
      
      if (isRecent && (text.includes('missile') || text.includes('drone') || text.includes('rocket'))) {
        // Try to determine origin and target from event description
        // This is simplified - in production would use NLP
        let origin: [number, number] | null = null;
        let target: [number, number] | null = null;
        
        if (text.includes('from iran') || text.includes('iranian')) {
          origin = [35.6892, 51.3890]; // Tehran
        } else if (text.includes('from lebanon') || text.includes('hezbollah')) {
          origin = [33.8938, 35.5018]; // Beirut
        }
        
        if (text.includes('tel aviv')) {
          target = [32.0853, 34.7818];
        } else if (text.includes('jerusalem')) {
          target = [31.7683, 35.2137];
        } else if (event.location) {
          // Use event location as target
          const loc = event.location.toLowerCase();
          if (loc.includes('natanz')) target = [33.7222, 51.9161];
          else if (loc.includes('isfahan')) target = [32.6546, 51.6680];
        }
        
        if (origin && target) {
          trajectories.push({
            start: origin,
            end: target,
            duration: 15000, // 15 seconds for visibility
            type: text.includes('drone') ? 'drone' : 'missile',
            color: event.severity === 'critical' ? '#d32f2f' : '#ff5722'
          });
        }
      }
    });
    
    return trajectories;
  };

  // Get dynamic locations from conflict data
  const getEventLocations = () => {
    if (!conflictData) return [];
    
    const locations: any[] = [];
    
    // Add recent events from timeline
    conflictData.timeline.slice(0, 20).forEach((event: TimelineEvent, index: number) => {
      // Try to match event location to known coordinates
      const location = event.location.toLowerCase();
      let coords: [number, number] | null = null;
      
      if (location.includes('natanz')) coords = [NUCLEAR_FACILITIES.NATANZ.coordinates.lat, NUCLEAR_FACILITIES.NATANZ.coordinates.lng];
      else if (location.includes('arak')) coords = [NUCLEAR_FACILITIES.ARAK.coordinates.lat, NUCLEAR_FACILITIES.ARAK.coordinates.lng];
      else if (location.includes('bushehr')) coords = [NUCLEAR_FACILITIES.BUSHEHR.coordinates.lat, NUCLEAR_FACILITIES.BUSHEHR.coordinates.lng];
      else if (location.includes('fordow') || location.includes('qom')) coords = [NUCLEAR_FACILITIES.FORDOW.coordinates.lat, NUCLEAR_FACILITIES.FORDOW.coordinates.lng];
      else if (location.includes('tel aviv')) coords = [32.0853, 34.7818];
      else if (location.includes('tehran')) coords = [35.6892, 51.3890];
      else if (location.includes('jerusalem')) coords = [31.7683, 35.2137];
      else if (location.includes('damascus')) coords = [33.5138, 36.2765];
      else if (location.includes('beirut')) coords = [33.8938, 35.5018];
      else if (location.includes('isfahan')) coords = [32.6546, 51.6680];
      
      if (coords) {
        const isRecent = new Date().getTime() - new Date(event.timestamp).getTime() < 3600000; // Last hour
        locations.push({
          id: `event-${index}`,
          name: event.title,
          coordinates: coords,
          type: 'strike',
          description: event.description,
          severity: event.severity,
          timestamp: event.timestamp,
          isActive: isRecent,
        });
      }
    });
    
    return locations;
  };

  const tileLayerUrl = {
    dark: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  const eventLocations = getEventLocations();

  return (
    <Card sx={{ height: '100%', minHeight: 600 }}>
      <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Map Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #333', backgroundColor: '#0a0a0a' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MapIcon sx={{ mr: 1, color: '#ff9800' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                CONFLICT MAP
              </Typography>
              <Chip
                label="LIVE"
                size="small"
                color="error"
                sx={{ ml: 2, animation: 'pulse 2s infinite' }}
              />
            </Box>
            
            {/* Map Controls */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <ToggleButtonGroup
                value={mapLayer}
                exclusive
                onChange={(e, newLayer) => newLayer && setMapLayer(newLayer)}
                size="small"
              >
                <ToggleButton value="satellite">
                  <Tooltip title="Satellite View">
                    <LayersIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="terrain">
                  <Tooltip title="Terrain View">
                    <MapIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="dark">
                  <Tooltip title="Dark Mode">
                    <LocationIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Map Controls */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showHeatMap}
                  onChange={(e) => setShowHeatMap(e.target.checked)}
                  size="small"
                />
              }
              label="Conflict Heat Map"
              sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }}
            />
            <Typography variant="caption" color="text.secondary">
              Showing events from last 24 hours
            </Typography>
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<TargetIcon sx={{ color: '#ff9800' }} />} 
              label="Nuclear Facility" 
              size="small" 
              variant="outlined"
            />
            <Chip 
              icon={<FireIcon sx={{ color: '#f44336' }} />} 
              label="Active Strike" 
              size="small" 
              variant="outlined"
              sx={{ '& .MuiChip-icon': { animation: 'pulse 1s infinite' } }}
            />
            <Chip 
              icon={<LocationIcon sx={{ color: '#2196f3' }} />} 
              label="Major City" 
              size="small" 
              variant="outlined"
            />
            <Chip 
              label="Heat Zone" 
              size="small" 
              variant="filled"
              sx={{ backgroundColor: 'rgba(255, 0, 0, 0.3)' }}
            />
          </Box>
        </Box>

        {/* Map Container */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <MapContainer
            center={MAP_DEFAULTS.CENTER}
            zoom={MAP_DEFAULTS.ZOOM - 1}
            style={{ height: '100%', width: '100%' }}
            minZoom={MAP_DEFAULTS.MIN_ZOOM}
            maxZoom={MAP_DEFAULTS.MAX_ZOOM}
          >
            <TileLayer
              url={tileLayerUrl[mapLayer]}
              attribution='&copy; Enhanced Conflict Tracker'
            />
            
            {/* Heat Map Layer */}
            {showHeatMap && osintData?.gdelt?.hotspots && (
              <HeatMapLayer hotspots={osintData.gdelt.hotspots} />
            )}
            
            {/* Nuclear Facilities with enhanced markers */}
            {conflictData && conflictData.facilities.map((facility: Facility) => {
              const facilityInfo = Object.values(NUCLEAR_FACILITIES).find((f: any) => f.name === facility.name);
              if (!facilityInfo) return null;
              
              return (
                <Marker
                  key={facility.id}
                  position={[facilityInfo.coordinates.lat, facilityInfo.coordinates.lng]}
                  icon={facilityIcon}
                  eventHandlers={{
                    click: () => setSelectedLocation(facility),
                  }}
                >
                  <Popup>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {facility.name}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Status: <Chip 
                          label={facility.status} 
                          size="small" 
                          color={
                            facility.status === 'operational' ? 'success' :
                            facility.status === 'damaged' ? 'warning' : 'error'
                          }
                          sx={{ height: 16, fontSize: '0.7rem' }}
                        />
                      </Typography>
                      <Typography variant="caption" display="block">
                        Radiation: {facility.radiationRisk}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Last Strike: {facility.lastStrike}
                      </Typography>
                    </Box>
                  </Popup>
                </Marker>
              );
            })}
            
            {/* Enhanced Event Locations with active indicators */}
            {eventLocations.map((location: any) => (
              <CircleMarker
                key={location.id}
                center={location.coordinates}
                radius={location.isActive ? 20 : 15}
                fillColor={location.isActive ? '#ff0000' : '#f44336'}
                color="#fff"
                weight={2}
                opacity={1}
                fillOpacity={location.isActive ? 0.8 : 0.6}
                eventHandlers={{
                  click: () => setSelectedLocation(location),
                }}
              >
                <Popup>
                  <Box sx={{ minWidth: 250 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {location.name}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      {new Date(location.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      {location.description}
                    </Typography>
                    {location.isActive && (
                      <Chip 
                        label="ACTIVE" 
                        size="small" 
                        color="error" 
                        sx={{ mt: 1, animation: 'pulse 1s infinite' }}
                      />
                    )}
                  </Box>
                </Popup>
              </CircleMarker>
            ))}
            
            {/* Major Cities with enhanced styling */}
            <Marker position={[35.6892, 51.3890]} icon={cityIcon}>
              <Popup>
                <strong>Tehran, Iran</strong><br/>
                Population: 9.5M<br/>
                Strategic importance: Capital
              </Popup>
            </Marker>
            <Marker position={[32.0853, 34.7818]} icon={cityIcon}>
              <Popup>
                <strong>Tel Aviv, Israel</strong><br/>
                Population: 4.3M<br/>
                Strategic importance: Economic center
              </Popup>
            </Marker>
            <Marker position={[31.7683, 35.2137]} icon={cityIcon}>
              <Popup>
                <strong>Jerusalem</strong><br/>
                Population: 1M<br/>
                Strategic importance: Capital
              </Popup>
            </Marker>
            <Marker position={[33.5138, 36.2765]} icon={cityIcon}>
              <Popup>
                <strong>Damascus, Syria</strong><br/>
                Population: 2.5M<br/>
                Strategic importance: Regional ally
              </Popup>
            </Marker>
            <Marker position={[33.8938, 35.5018]} icon={cityIcon}>
              <Popup>
                <strong>Beirut, Lebanon</strong><br/>
                Population: 2.4M<br/>
                Strategic importance: Hezbollah presence
              </Popup>
            </Marker>
            
            {/* Show trajectories for actual missile/drone events */}
            {getActiveTrajectories().map((trajectory, index) => (
              <AnimatedTrajectory key={`trajectory-${index}`} {...trajectory} />
            ))}
          </MapContainer>

          {/* Event Counter */}
          <Paper sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            p: 1, 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
          }}>
            <Typography variant="caption" sx={{ color: '#ff9800' }}>
              Active Events: {eventLocations.filter(e => e.isActive).length}
            </Typography>
          </Paper>
        </Box>

        {/* Selected Location Details */}
        {selectedLocation && (
          <Box sx={{ p: 2, borderTop: '1px solid #333', backgroundColor: '#0a0a0a' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {selectedLocation.name}
            </Typography>
            {selectedLocation.location && (
              <Typography variant="caption" color="text.secondary">
                📍 {selectedLocation.location}
              </Typography>
            )}
            {selectedLocation.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedLocation.description}
              </Typography>
            )}
            {selectedLocation.severity && (
              <Chip
                label={`Severity: ${selectedLocation.severity}`}
                size="small"
                color={selectedLocation.severity === 'critical' ? 'error' : 'warning'}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        )}

        <style>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .animated-marker {
            animation: pulse 2s infinite;
          }
          
          .pulse-ring {
            animation: pulse-ring 2s infinite;
          }
          
          @keyframes pulse-ring {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default EnhancedConflictMap;