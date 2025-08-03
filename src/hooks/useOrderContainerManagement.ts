import { useState, useEffect, useCallback } from 'react';
import {
  takeOrder,
  confirmOrder,
  completeOrder,
  updateOrderStatus,
  subscribeToOrderUpdates,
  getOrderWithDetails,
  unsubscribeFromOrderUpdates
} from '../services/orderService';
import { 
  updateContainerLocation,
  subscribeToContainerUpdates,
  subscribeToLocationUpdates,
  getContainerById,
  unsubscribeFromContainerUpdates
} from '../services/containerService';
import { Order, Container, LocationUpdate } from '../types';

interface UseOrderContainerManagementProps {
  orderId?: number;
  containerId?: string;
  enableRealTimeUpdates?: boolean;
}

interface OrderContainerState {
  order: Order | null;
  container: Container | null;
  loading: boolean;
  error: string | null;
  locationHistory: LocationUpdate[];
}

export function useOrderContainerManagement({
  orderId,
  containerId,
  enableRealTimeUpdates = true
}: UseOrderContainerManagementProps = {}) {
  const [state, setState] = useState<OrderContainerState>({
    order: null,
    container: null,
    loading: false,
    error: null,
    locationHistory: []
  });

  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  // Update state helper
  const updateState = useCallback((updates: Partial<OrderContainerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Load order details
  const loadOrder = useCallback(async (id: number) => {
    updateState({ loading: true, error: null });
    try {
      const orderData = await getOrderWithDetails(id);
      updateState({ order: orderData, loading: false });
      return orderData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load order';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [updateState]);

  // Load container details
  const loadContainer = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      const containerData = await getContainerById(id);
      updateState({ container: containerData, loading: false });
      return containerData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load container';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [updateState]);

  // Take order - confirm order and assign container to current user
  const handleTakeOrder = useCallback(async (
    orderIdToTake: number,
    currentUserId: number,
    vehicleId: number
  ) => {
    updateState({ loading: true, error: null });
    try {
      const takenOrder = await takeOrder(orderIdToTake, currentUserId, vehicleId);
      updateState({ order: takenOrder, loading: false });
      
      // Reload container to see assignment
      if (takenOrder.container_id) {
        await loadContainer(takenOrder.container_id);
      }
      
      return takenOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to take order';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [updateState, loadContainer]);

  // Legacy confirm order function for backward compatibility
  const handleConfirmOrder = useCallback(async (
    orderIdToConfirm: number,
    vehicleId: number,
    transporterId: number
  ) => {
    return handleTakeOrder(orderIdToConfirm, transporterId, vehicleId);
  }, [handleTakeOrder]);

  // Complete order and unassign container
  const handleCompleteOrder = useCallback(async (orderIdToComplete: number) => {
    updateState({ loading: true, error: null });
    try {
      const completedOrder = await completeOrder(orderIdToComplete);
      updateState({ order: completedOrder, loading: false });
      
      // Reload container to see unassignment
      if (completedOrder.container_id) {
        await loadContainer(completedOrder.container_id);
      }
      
      return completedOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete order';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [updateState, loadContainer]);

  // Update order status
  const handleUpdateOrderStatus = useCallback(async (
    orderIdToUpdate: number,
    newStatus: Order['status'],
    vehicleId?: number
  ) => {
    updateState({ loading: true, error: null });
    try {
      const updatedOrder = await updateOrderStatus(orderIdToUpdate, newStatus, vehicleId);
      updateState({ order: updatedOrder, loading: false });
      return updatedOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [updateState]);

  // Update container location
  const handleUpdateLocation = useCallback(async (
    containerIdToUpdate: string,
    latitude: number,
    longitude: number
  ) => {
    try {
      const updatedContainer = await updateContainerLocation(containerIdToUpdate, latitude, longitude);
      
      // Add to location history
      const locationUpdate: LocationUpdate = {
        container_id: containerIdToUpdate,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      };
      
      updateState({
        container: updatedContainer,
        locationHistory: [...state.locationHistory, locationUpdate]
      });
      
      return updatedContainer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update location';
      updateState({ error: errorMessage });
      throw error;
    }
  }, [updateState]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const newSubscriptions: any[] = [];

    // Subscribe to order updates
    if (orderId) {
      const orderSub = subscribeToOrderUpdates((payload) => {
        console.log('Order update received:', payload);
        
        // Update order in state
        updateState({ order: payload.new });
        
        // Handle status changes
        if (payload.new.status !== payload.old.status) {
          console.log(`Order ${payload.new.id} status changed: ${payload.old.status} → ${payload.new.status}`);
          
          // Reload container if assignment changed
          if (payload.new.container_id && 
              (payload.new.status === 'confirmed' || payload.new.status === 'completed')) {
            loadContainer(payload.new.container_id);
          }
        }
      }, orderId);
      
      newSubscriptions.push(orderSub);
    }

    // Subscribe to container updates
    if (containerId) {
      const containerSub = subscribeToContainerUpdates((payload) => {
        console.log('Container update received:', payload);
        
        // Update container in state
        updateState({ container: payload.new });
        
        // Handle assignment changes
        if (payload.new.assigned_to !== payload.old.assigned_to ||
            payload.new.vehicle_id !== payload.old.vehicle_id) {
          console.log(`Container ${payload.new.id} assignment changed`);
        }
      }, containerId);
      
      newSubscriptions.push(containerSub);
    }

    // Subscribe to location updates
    const locationSub = subscribeToLocationUpdates((payload) => {
      console.log('Location update received:', payload);
      
      const locationUpdate: LocationUpdate = {
        container_id: payload.payload.container_id,
        latitude: payload.payload.latitude,
        longitude: payload.payload.longitude,
        timestamp: payload.payload.timestamp
      };
      
      // Add to location history
      setState(prev => ({
        ...prev,
        locationHistory: [...prev.locationHistory, locationUpdate]
      }));
      
      // Update container location if it matches our container
      if (containerId && payload.payload.container_id === containerId) {
        setState(prev => ({
          ...prev,
          container: prev.container ? {
            ...prev.container,
            current_lat: payload.payload.latitude,
            current_lng: payload.payload.longitude,
            last_updated: payload.payload.timestamp
          } : null
        }));
      }
    });
    
    newSubscriptions.push(locationSub);
    setSubscriptions(newSubscriptions);

    // Cleanup function
    return () => {
      newSubscriptions.forEach(sub => {
        if (sub) {
          unsubscribeFromOrderUpdates(sub);
          unsubscribeFromContainerUpdates(sub);
        }
      });
    };
  }, [orderId, containerId, enableRealTimeUpdates, updateState, loadContainer]);

  // Load initial data
  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId, loadOrder]);

  useEffect(() => {
    if (containerId) {
      loadContainer(containerId);
    }
  }, [containerId, loadContainer]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptions.forEach(sub => {
        if (sub) {
          unsubscribeFromOrderUpdates(sub);
          unsubscribeFromContainerUpdates(sub);
        }
      });
    };
  }, [subscriptions]);

  return {
    // State
    order: state.order,
    container: state.container,
    loading: state.loading,
    error: state.error,
    locationHistory: state.locationHistory,
    
    // Actions
    takeOrder: handleTakeOrder,
    confirmOrder: handleConfirmOrder, // Legacy support
    completeOrder: handleCompleteOrder,
    updateOrderStatus: handleUpdateOrderStatus,
    updateLocation: handleUpdateLocation,
    loadOrder,
    loadContainer,
    
    // Utilities
    clearError: () => updateState({ error: null }),
    isOrderActive: state.order?.status === 'confirmed',
    isContainerAssigned: !!state.container?.assigned_to,
    currentLocation: state.container ? {
      lat: state.container.current_lat || state.container.latitude,
      lng: state.container.current_lng || state.container.longitude
    } : null
  };
}

// Example usage in a React component:
/*

function OrderTrackingComponent({ orderId }: { orderId: number }) {
  const {
    order,
    container,
    loading,
    error,
    locationHistory,
    confirmOrder,
    completeOrder,
    updateLocation,
    clearError,
    isOrderActive,
    isContainerAssigned,
    currentLocation
  } = useOrderContainerManagement({ 
    orderId, 
    containerId: order?.container_id,
    enableRealTimeUpdates: true 
  });

  const handleConfirm = async () => {
    try {
      await confirmOrder(orderId, 1, 'transporter-uuid');
      alert('Order confirmed and container assigned!');
    } catch (error) {
      console.error('Failed to confirm order:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await completeOrder(orderId);
      alert('Order completed and container unassigned!');
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  };

  const simulateLocationUpdate = async () => {
    if (container?.id) {
      const randomLat = 6.9 + Math.random() * 0.4; // Random location in Sri Lanka
      const randomLng = 79.8 + Math.random() * 0.8;
      
      try {
        await updateLocation(container.id, randomLat, randomLng);
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error} <button onClick={clearError}>Clear</button></div>;

  return (
    <div>
      <h2>Order Tracking</h2>
      
      {order && (
        <div>
          <h3>Order #{order.id}</h3>
          <p>Status: {order.status}</p>
          <p>From: {order.pickup_address}</p>
          <p>To: {order.drop_address}</p>
          <p>Price: ${order.price}</p>
        </div>
      )}
      
      {container && (
        <div>
          <h3>Container: {container.name}</h3>
          <p>Status: {container.status}</p>
          <p>Assigned: {isContainerAssigned ? 'Yes' : 'No'}</p>
          <p>Temperature: {container.temperature}°C</p>
          <p>Humidity: {container.humidity}%</p>
          <p>Battery: {container.battery_level}%</p>
          
          {currentLocation && (
            <p>Location: {currentLocation.lat}, {currentLocation.lng}</p>
          )}
        </div>
      )}
      
      <div>
        <button onClick={handleConfirm} disabled={order?.status !== 'pending'}>
          Confirm Order
        </button>
        <button onClick={handleComplete} disabled={!isOrderActive}>
          Complete Order
        </button>
        <button onClick={simulateLocationUpdate} disabled={!container}>
          Update Location
        </button>
      </div>
      
      {locationHistory.length > 0 && (
        <div>
          <h4>Location History</h4>
          {locationHistory.map((loc, index) => (
            <div key={index}>
              {loc.timestamp}: {loc.latitude}, {loc.longitude}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

*/