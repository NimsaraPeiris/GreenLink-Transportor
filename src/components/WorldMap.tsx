import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { SRI_LANKA_CENTER } from '../utils/geocoding';
import 'leaflet/dist/leaflet.css';

export interface ContainerMarker {
  id: number;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  status: 'active' | 'inactive' | 'warning';
  temperature?: number;
  humidity?: number;
  battery_level?: number;
}

export interface RouteData {
  id: number;
  name: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  risk_level: 'low' | 'medium' | 'high' | null;
  total_shipments: number;
  delayed_shipments: number;
}

interface WorldMapProps {
  containers: ContainerMarker[];
  routes: RouteData[];
  isLoading: boolean;
  height?: string;
}

export default function WorldMap({ 
  containers, 
  routes, 
  isLoading,
  height = '500px'
}: WorldMapProps) {
  // Filter to only show assigned containers
  const assignedContainers = containers.filter(container => 
    container.assigned_to !== null && container.vehicle_id !== null
  );

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500 flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-green-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height }}>
      <MapContainer 
        center={[SRI_LANKA_CENTER.lat, SRI_LANKA_CENTER.lng]} 
        zoom={8} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Only render assigned containers */}
        {assignedContainers.map(container => (
          <Marker 
            key={container.id}
            position={[container.coordinates.lat, container.coordinates.lng]}
            // icon={createStatusIcon(container.status)} // Uncomment if using custom icons
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg">{container.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{container.location}</p>
                <div className="space-y-2">
                  <p className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      container.status === 'active' ? 'text-green-600' :
                      container.status === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
                    </span>
                  </p>
                  {container.temperature && (
                    <p className="flex justify-between text-sm">
                      <span>Temperature:</span>
                      <span>{container.temperature}°C</span>
                    </p>
                  )}
                  {container.humidity && (
                    <p className="flex justify-between text-sm">
                      <span>Humidity:</span>
                      <span>{container.humidity}%</span>
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
