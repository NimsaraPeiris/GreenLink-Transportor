import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { OrderWithDetails } from '../../types';
import Button from '../ui/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { calculateDistance } from '../../utils';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface TrackingMapProps {
    order: OrderWithDetails;
    userLocation: { lat: number; lng: number } | null;
    routeCoordinates: [number, number][];
    isTracking: boolean;
    setMapVisible: (visible: boolean) => void;
    stopLocationTracking: () => void;
    startLocationTracking: (orderId: number) => void;
    getCurrentLocation: () => Promise<{ lat: number; lng: number }>;
}

const TrackingMap = ({
    order,
    userLocation,
    routeCoordinates,
    isTracking,
    setMapVisible,
    stopLocationTracking,
    startLocationTracking,
    getCurrentLocation
}: TrackingMapProps) => {
    const [localRouteCoordinates, setLocalRouteCoordinates] = useState<[number, number][]>([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    const fetchRoute = async () => {
        setIsLoadingRoute(true);
        try {
            // Using OSRM (Open Source Routing Machine) - free routing service
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${order.pickup_lng},${order.pickup_lat};${order.drop_lng},${order.drop_lat}?overview=full&geometries=geojson`
            );
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                const coordinates = data.routes[0].geometry.coordinates.map(
                    ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
                );
                setLocalRouteCoordinates(coordinates);
                toast.success('Route loaded successfully!');
            } else {
                // Fallback to straight line if no route found
                const straightLine: [number, number][] = [
                    [order.pickup_lat, order.pickup_lng],
                    [order.drop_lat, order.drop_lng]
                ];
                setLocalRouteCoordinates(straightLine);
                toast('Using direct route (road route unavailable)', {
                    icon: 'ℹ️',
                });
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            // Fallback to straight line on error
            const straightLine: [number, number][] = [
                [order.pickup_lat, order.pickup_lng],
                [order.drop_lat, order.drop_lng]
            ];
            setLocalRouteCoordinates(straightLine);
            toast('Using direct route (road route unavailable)', {
                icon: 'ℹ️',
            });
        } finally {
            setIsLoadingRoute(false);
        }
    };

    useEffect(() => {
        fetchRoute();
    }, [order]);

    const updateContainerLocation = async () => {
        try {
            // Get current device location
            const deviceLocation = await getCurrentLocation();
            
            // Update container location in the database
            const { error } = await supabase
                .from('containers')
                .update({
                    latitude: deviceLocation.lat,
                    longitude: deviceLocation.lng,
                    updated_at: new Date().toISOString()
                })
                .eq('id', order.container_id);
            
            if (error) throw error;
            
            // Also update the order's current location
            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    current_lat: deviceLocation.lat,
                    current_lng: deviceLocation.lng
                })
                .eq('id', order.id);
                
            if (orderError) throw orderError;
            
            toast.success('📦 Package location updated to your current location!');
        } catch (error: any) {
            console.error('Error updating container location:', error);
            toast.error('Failed to update package location: ' + (error.message || 'Unknown error'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-5xl h-4/5 relative">
                <button 
                    className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 z-10 bg-white rounded-full p-2 shadow-lg" 
                    onClick={() => {
                        setMapVisible(false);
                        stopLocationTracking();
                    }}
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                <div className="h-full flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Tracking Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {order.pickup_address} → {order.drop_address}
                        </p>
                    </div>
                    
                    <div className="flex-1 rounded-lg overflow-hidden">
                        <MapContainer 
                            center={userLocation ? [userLocation.lat, userLocation.lng] : [order.pickup_lat, order.pickup_lng]} 
                            zoom={13} 
                            scrollWheelZoom={true} 
                            className="h-full w-full"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                            />
                            
                            {/* Route Line */}
                            {localRouteCoordinates.length > 0 && (
                                <Polyline 
                                    positions={localRouteCoordinates} 
                                    color="#3B82F6"
                                    weight={4}
                                    opacity={0.8}
                                />
                            )}
                            
                            {isLoadingRoute && (
                                <div className="absolute top-4 left-4 bg-white p-2 rounded shadow-lg z-10">
                                    <span className="text-sm text-gray-600">Loading route...</span>
                                </div>
                            )}
                            
                            {/* User's Current Location */}
                            {userLocation && (
                                <Marker 
                                    position={[userLocation.lat, userLocation.lng]} 
                                    icon={L.divIcon({ 
                                        className: 'bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg', 
                                        html: '🚚', 
                                        iconSize: [30, 30] 
                                    })}
                                >
                                    <Popup>
                                        <div className="text-center">
                                            <strong>Your Location</strong><br/>
                                            {isTracking ? '📍 Live Tracking Active' : '📍 Location'}
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                            
                            {/* Pickup Location */}
                            <Marker 
                                position={[order.pickup_lat, order.pickup_lng]} 
                                icon={L.divIcon({ 
                                    className: 'bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg', 
                                    html: '📦', 
                                    iconSize: [30, 30] 
                                })}
                            >
                                <Popup>
                                    <div>
                                        <strong>Pickup Location</strong><br/>
                                        {order.pickup_address}
                                    </div>
                                </Popup>
                            </Marker>
                            
                            {/* Drop-off Location */}
                            <Marker 
                                position={[order.drop_lat, order.drop_lng]} 
                                icon={L.divIcon({ 
                                    className: 'bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg', 
                                    html: '📍', 
                                    iconSize: [30, 30] 
                                })}
                            >
                                <Popup>
                                    <div>
                                        <strong>Drop-off Location</strong><br/>
                                        {order.drop_address}
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                    
                    {/* Control Panel */}
                    <div className="mt-4 flex flex-wrap gap-3 justify-between items-center bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                <span className="text-sm font-medium">
                                    {isTracking ? 'Live Tracking Active' : 'Tracking Stopped'}
                                </span>
                            </div>
                            {userLocation && order && (
                                <div className="text-sm text-gray-600">
                                    Distance to pickup: {calculateDistance(
                                        userLocation.lat, userLocation.lng,
                                        order.pickup_lat, order.pickup_lng
                                    )} km
                                </div>
                            )}
                        </div>
                        
                        <div className="flex space-x-2">
                            <Button 
                                variant={isTracking ? "destructive" : "primary"}
                                size="sm"
                                onClick={() => {
                                    if (isTracking) {
                                        stopLocationTracking();
                                        toast.success('Location tracking stopped');
                                    } else {
                                        startLocationTracking(order.id);
                                        toast.success('Location tracking started');
                                    }
                                }}
                            >
                                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                            </Button>
                            
                            <Button 
                                variant="outline"
                                size="sm"
                                onClick={updateContainerLocation}
                            >
                                Update Package Location
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingMap;
