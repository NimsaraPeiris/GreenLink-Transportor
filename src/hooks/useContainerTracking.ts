import { useEffect, useState } from 'react';
import { Container } from '../types';
import { subscribeToContainerUpdates, unsubscribeFromContainerUpdates, updateContainerLocation } from '../services/containerService';

export function useContainerTracking(containers: Container[]) {
  const [trackedContainers, setTrackedContainers] = useState<Container[]>(containers);

  useEffect(() => {
    setTrackedContainers(containers);
  }, [containers]);

  useEffect(() => {
    // Subscribe to real-time container updates
    const subscription = subscribeToContainerUpdates((payload) => {
      const updatedContainer = payload.new as Container;
      
      setTrackedContainers(prev => 
        prev.map(container => 
          container.id === updatedContainer.id 
            ? { ...container, ...updatedContainer }
            : container
        )
      );
    });

    return () => {
      unsubscribeFromContainerUpdates(subscription);
    };
  }, []);

  // Function to update container location (simulating device location updates)
  const updateLocation = async (containerId: string, latitude: number, longitude: number) => {
    try {
      await updateContainerLocation(containerId, latitude, longitude);
    } catch (error) {
      console.error('Failed to update container location:', error);
    }
  };

  // Simulate device location updates (for testing purposes)
  const simulateLocationUpdate = (containerId: string) => {
    const container = trackedContainers.find(c => c.id.toString() === containerId);
    if (container && container.latitude && container.longitude) {
      // Simulate small movement around current location
      const latOffset = (Math.random() - 0.5) * 0.001; // ~100m radius
      const lngOffset = (Math.random() - 0.5) * 0.001;
      
      const newLat = container.latitude + latOffset;
      const newLng = container.longitude + lngOffset;
      
      updateLocation(containerId, newLat, newLng);
    }
  };

  return {
    trackedContainers,
    updateLocation,
    simulateLocationUpdate
  };
}

// Hook for tracking a single container's real-time updates
export function useSingleContainerTracking(containerId: string) {
  const [container, setContainer] = useState<Container | null>(null);
  const [locationHistory, setLocationHistory] = useState<Array<{lat: number, lng: number, timestamp: Date}>>([]);

  useEffect(() => {
    // Subscribe to updates for specific container
    const subscription = subscribeToContainerUpdates((payload) => {
      const updatedContainer = payload.new as Container;
      
      if (updatedContainer.id.toString() === containerId) {
        setContainer(updatedContainer);
        
        // Track location history
        if (updatedContainer.latitude && updatedContainer.longitude) {
          setLocationHistory(prev => [
            ...prev,
            {
              lat: updatedContainer.latitude!,
              lng: updatedContainer.longitude!,
              timestamp: new Date()
            }
          ].slice(-100)); // Keep last 100 locations
        }
      }
    });

    return () => {
      unsubscribeFromContainerUpdates(subscription);
    };
  }, [containerId]);

  return {
    container,
    locationHistory
  };
}
