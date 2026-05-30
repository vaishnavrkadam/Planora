import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Box, Paper, Typography } from '@mui/material';
import L from 'leaflet';

// Fix for default Leaflet marker icon paths disappearing in bundled React environments
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Internal controller to handle smooth viewpoint shifting
function MapController({ focusedCoords, allMarkers, forceFitBounds }) {
  const map = useMap();

  useEffect(() => {
    // Mode A: Focus on a specific clicked card location
    if (focusedCoords && !forceFitBounds) {
      map.setView(focusedCoords, 14, { animate: true, duration: 0.6 });
    } 
    // Mode B: Fit bounds to show all markers together
    else if (allMarkers && allMarkers.length > 0) {
      const points = allMarkers.map(m => [m.latitude, m.longitude]);
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
    }

    // Standard tile re-stitching execution layout
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [focusedCoords, allMarkers, forceFitBounds, map]);

  return null;
}

export default function TripMap({ timeline, focusedCoords, forceFitBounds }) {
  const activeMarkers = timeline.filter(item => item.latitude && item.longitude);
  
  // Set default center coordinate system anchor fallback
  const defaultCenter = activeMarkers.length > 0 
    ? [activeMarkers[0].latitude, activeMarkers[0].longitude] 
    : [12.2958, 76.6394];

  return (
    <Paper 
      sx={{ 
        p: 0, height: '400px', borderRadius: '24px', overflow: 'hidden', position: 'relative',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        backgroundColor: '#0b1326'
      }}
    >
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%', borderRadius: '24px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController 
          focusedCoords={focusedCoords} 
          allMarkers={activeMarkers} 
          forceFitBounds={forceFitBounds} 
        />

        {activeMarkers.map((item, idx) => (
          <Marker key={idx} position={[item.latitude, item.longitude]}>
            <Popup>
              <Box sx={{ color: '#0b1326', p: 0.5, maxWidth: 200 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: '700', mb: 0.5 }}>{item.title}</Typography>
                <Typography variant="caption" sx={{ color: '#494454', display: 'block' }}>{item.time} — {item.cost}</Typography>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Paper>
  );
}