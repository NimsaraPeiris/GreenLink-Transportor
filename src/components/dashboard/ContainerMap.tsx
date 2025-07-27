import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Container } from '../../types';
import Card from '../ui/Card';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="p-4 border-b">{children}</div>;
const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>;
const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="p-4">{children}</div>;

export interface ContainerWithOrder extends Container {
  order_id?: number;
}

interface ContainerMapProps {
  containers: ContainerWithOrder[];
}

const ContainerMap: React.FC<ContainerMapProps> = ({ containers }) => {
  const validContainers = containers.filter(c => c.latitude != null && c.longitude != null);

  const position: [number, number] = validContainers.length > 0 
    ? [validContainers[0].latitude!, validContainers[0].longitude!] 
    : [51.505, -0.09]; // Default position if no containers

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Container Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] rounded-md overflow-hidden">
          <MapContainer center={position} zoom={validContainers.length > 0 ? 8 : 2} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {validContainers.map(container => (
              <Marker key={container.id} position={[container.latitude!, container.longitude!]} >
                <Popup>
                  <div>
                    <h4 className="font-bold">{container.name}</h4>
                    <p>Status: {container.status}</p>
                    {container.order_id && <p>Order ID: {container.order_id}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContainerMap;
