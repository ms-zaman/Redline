'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  name: string;
  mentions: number;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  confidence: string;
  last_mentioned: string;
}

interface MapComponentProps {
  locations: LocationData[];
}

export default function MapComponent({ locations }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([23.6850, 90.3563], 7);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Create markers layer group
      markersRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.clearLayers();
    }

    // Add markers for locations
    locations.forEach(location => {
      if (location.coordinates && markersRef.current) {
        // Create custom icon based on mention count
        const iconSize = Math.min(Math.max(location.mentions / 2 + 20, 25), 50);
        const color = getMarkerColor(location.mentions);
        
        const customIcon = L.divIcon({
          html: `
            <div style="
              background-color: ${color};
              width: ${iconSize}px;
              height: ${iconSize}px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${Math.max(iconSize / 4, 10)}px;
            ">
              ${location.mentions}
            </div>
          `,
          className: 'custom-marker',
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2]
        });

        const marker = L.marker([location.coordinates.lat, location.coordinates.lng], {
          icon: customIcon
        });

        // Create popup content
        const popupContent = `
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-lg text-gray-900 mb-2">${location.name}</h3>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Mentions:</span>
                <span class="font-medium">${location.mentions}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Confidence:</span>
                <span class="font-medium">${(parseFloat(location.confidence) * 100).toFixed(0)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Last mentioned:</span>
                <span class="font-medium">${new Date(location.last_mentioned).toLocaleDateString()}</span>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span>Coordinates:</span>
                <span>${location.coordinates.lat.toFixed(4)}, ${location.coordinates.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });

        markersRef.current.addLayer(marker);
      }
    });

    // Fit map to show all markers if there are any
    if (locations.length > 0 && markersRef.current) {
      const validLocations = locations.filter(loc => loc.coordinates);
      if (validLocations.length > 0) {
        const group = new L.featureGroup(markersRef.current.getLayers());
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }

    // Cleanup function
    return () => {
      // Don't destroy the map instance, just clear markers
    };
  }, [locations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const getMarkerColor = (mentions: number): string => {
    if (mentions >= 30) return '#dc2626'; // red-600
    if (mentions >= 20) return '#ea580c'; // orange-600
    if (mentions >= 10) return '#d97706'; // amber-600
    if (mentions >= 5) return '#65a30d';  // lime-600
    return '#2563eb'; // blue-600
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Mentions</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-600 mr-2"></div>
            <span>30+ mentions</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-orange-600 mr-2"></div>
            <span>20-29 mentions</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-amber-600 mr-2"></div>
            <span>10-19 mentions</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-lime-600 mr-2"></div>
            <span>5-9 mentions</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-600 mr-2"></div>
            <span>1-4 mentions</span>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-sm">
          <div className="font-semibold text-gray-900">🇧🇩 Bangladesh News Map</div>
          <div className="text-gray-600 mt-1">
            {locations.length} locations • Click markers for details
          </div>
        </div>
      </div>
    </div>
  );
}
