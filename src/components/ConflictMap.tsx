import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Map as MapIcon,
  Layers as LayersIcon,
  MyLocation as LocationIcon,
  Fullscreen as FullscreenIcon,
  FlightTakeoff as FlightIcon,
  Warning as WarningIcon,
  LocalFireDepartment as FireIcon,
  GpsFixed as TargetIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useConflictData } from '../contexts/ConflictDataContext';
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

// Custom icons for different location types
const createCustomIcon = (color: string, symbol: string) => L.divIcon({
  html: `<div style="
    background-color: ${color};
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    font-size: 16px;
  ">${symbol}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  className: 'custom-div-icon',
});

const facilityIcon = createCustomIcon('#ff9800', '☢️');
const strikeIcon = createCustomIcon('#f44336', '💥');
const cityIcon = createCustomIcon('#2196f3', '🏙️');

const ConflictMap: React.FC = () => {
  const { data: conflictData } = useConflictData();
  const [mapLayer, setMapLayer] = useState<'satellite' | 'terrain' | 'dark'>('dark');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Get dynamic locations from conflict data
  const getEventLocations = () => {
    if (!conflictData) return [];
    
    const locations: any[] = [];
    
    // Add recent events from timeline
    conflictData.timeline.slice(0, 10).forEach((event: TimelineEvent, index: number) => {
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
      
      if (coords) {
        locations.push({
          id: `event-${index}`,
          name: event.title,
          coordinates: coords,
          type: 'strike',
          description: event.description,
          severity: event.severity,
          timestamp: event.timestamp,
        });
      }
    });
    
    return locations;
  };

  const tileLayerUrl = {
    dark: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  const eventLocations = getEventLocations();

  return (
    <Card sx={{ height: '100%', minHeight: 500 }}>
      <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Map Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MapIcon sx={{ mr: 1, color: '#ff9800' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                CONFLICT MAP
              </Typography>
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
              label="Strike Location" 
              size="small" 
              variant="outlined"
            />
            <Chip 
              icon={<LocationIcon sx={{ color: '#2196f3' }} />} 
              label="City" 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Map Container */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <MapContainer
            center={MAP_DEFAULTS.CENTER}
            zoom={MAP_DEFAULTS.ZOOM}
            style={{ height: '100%', width: '100%' }}
            minZoom={MAP_DEFAULTS.MIN_ZOOM}
            maxZoom={MAP_DEFAULTS.MAX_ZOOM}
          >
            <TileLayer
              url={tileLayerUrl[mapLayer]}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Nuclear Facilities */}
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
            
            {/* Event Locations (Strikes, etc.) */}
            {eventLocations.map((location: any) => (
              <CircleMarker
                key={location.id}
                center={location.coordinates}
                radius={location.severity === 'critical' ? 15 : 10}
                fillColor="#f44336"
                color="#fff"
                weight={2}
                opacity={1}
                fillOpacity={0.7}
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
                  </Box>
                </Popup>
              </CircleMarker>
            ))}
            
            {/* Major Cities */}
            <Marker position={[35.6892, 51.3890]} icon={cityIcon}>
              <Popup>Tehran, Iran</Popup>
            </Marker>
            <Marker position={[32.0853, 34.7818]} icon={cityIcon}>
              <Popup>Tel Aviv, Israel</Popup>
            </Marker>
            <Marker position={[31.7683, 35.2137]} icon={cityIcon}>
              <Popup>Jerusalem</Popup>
            </Marker>
            
            {/* Example missile trajectory */}
            {eventLocations.length > 0 && (
              <Polyline
                positions={[
                  [35.6892, 51.3890], // Tehran
                  [32.0853, 34.7818], // Tel Aviv
                ]}
                color="#ff5722"
                weight={2}
                opacity={0.7}
                dashArray="10, 10"
              />
            )}
          </MapContainer>
        </Box>

        {/* Selected Location Details */}
        {selectedLocation && (
          <Box sx={{ p: 2, borderTop: '1px solid #333', backgroundColor: '#1a1a1a' }}>
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
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ConflictMap;