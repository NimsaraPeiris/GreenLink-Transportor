import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowPathIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { OrderWithDetails } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import TrackingMap from '../components/layout/TrackingMap';
import { calculateDistance, getTimeAgo } from '../utils';
import { useAuth } from '../contexts/AuthContext';

interface ContainersState {
  availableOrders: OrderWithDetails[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  mapVisible: boolean;
  currentOrder: OrderWithDetails | null;
  userLocation: any;
  routeCoordinates: any[];
  isTracking: boolean;
}

const Containers = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ContainersState>({
    availableOrders: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
    mapVisible: false,
    currentOrder: null,
    userLocation: null,
    routeCoordinates: [],
    isTracking: false,
  });

  const updateState = useCallback((updates: Partial<ContainersState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const { error, data } = await supabase
        .from('orders')
        .select('*, containers(name), users(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: OrderWithDetails[] = data.map((order) => ({
        ...order,
        container_name: order.containers?.name,
        user_name: order.users?.name
      }));

      updateState({
        availableOrders: formattedOrders,
        error: null
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch orders';
      updateState({ error: errorMessage });
      console.error('Fetch error:', err);
      toast.error(errorMessage);
    }
  }, [updateState]);

  const handleTakeOrder = useCallback(async (order: OrderWithDetails) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      console.log('Taking order:', order.id);
      
      // Simple database update - just change status to confirmed
      const { error } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (error) throw error;

      // Update container assignment
      const { error: containerError } = await supabase
        .from('containers')
        .update({
          assigned_to: 96, // Use sample user ID
          vehicle_id: 1,   // Use sample vehicle ID
          status: 'active'
        })
        .eq('id', order.container_id);

      if (containerError) throw containerError;

      console.log('Database updated, now updating UI state');

      // Update the UI state immediately
      setState(prev => ({
        ...prev,
        availableOrders: prev.availableOrders.map(o =>
          o.id === order.id ? { ...o, status: 'confirmed' as const } : o
        )
      }));

      console.log('UI state updated');
      toast.success('Order taken successfully!');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to take order';
      console.error('Error taking order:', err);
      toast.error(errorMessage);
    }
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    updateState({ isRefreshing: true });
    await fetchOrders();
    updateState({ isRefreshing: false });
    toast.success('Data refreshed successfully');
  }, [updateState, fetchOrders]);

  const handleTrackOrder = useCallback((order: OrderWithDetails) => {
    updateState({
      currentOrder: order,
      mapVisible: true,
      isTracking: true
    });
  }, [updateState]);

  const handleCompleteOrder = useCallback(async (order: OrderWithDetails) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      // Simple database update - just change status to completed
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id);

      if (error) throw error;

      // Update container to unassign
      const { error: containerError } = await supabase
        .from('containers')
        .update({
          assigned_to: null,
          vehicle_id: null,
          status: 'inactive'
        })
        .eq('id', order.container_id);

      if (containerError) throw containerError;

      // Update the UI state immediately
      setState(prev => ({
        ...prev,
        availableOrders: prev.availableOrders.map(o =>
          o.id === order.id ? { ...o, status: 'completed' as const } : o
        )
      }));

      toast.success('Order completed successfully!');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete order';
      console.error('Error completing order:', err);
      toast.error(errorMessage);
    }
  }, [user?.id, updateState]);

  const startLocationTracking = useCallback(() => {
    updateState({ isTracking: true });
    // Add your location tracking logic here
  }, [updateState]);

  const stopLocationTracking = useCallback(() => {
    updateState({ isTracking: false });
    // Add your stop tracking logic here
  }, [updateState]);

  const getCurrentLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  const closeMap = useCallback(() => {
    updateState({
      mapVisible: false,
      currentOrder: null,
      isTracking: false
    });
  }, [updateState]);

  useEffect(() => {
    fetchOrders().finally(() => updateState({ isLoading: false }));
  }, [fetchOrders, updateState]);

  const renderOrderActions = useCallback((order: OrderWithDetails) => {
    switch (order.status) {
      case 'pending':
        return (
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon={<TruckIcon className="h-4 w-4" />}
            onClick={() => handleTakeOrder(order)}
          >
            Take Order
          </Button>
        );

      case 'confirmed':
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              icon={<MapPinIcon className="h-4 w-4" />}
              onClick={() => handleTrackOrder(order)}
            >
              View Map
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              icon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={() => handleCompleteOrder(order)}
            >
              Complete Order
            </Button>
          </div>
        );

      case 'completed':
        return (
          <div className="flex-1 text-center py-2 text-green-600 font-medium">
            ✓ Completed
          </div>
        );

      default:
        return null;
    }
  }, [handleTakeOrder, handleTrackOrder, handleCompleteOrder]);

  const renderOrderCard = useCallback((order: OrderWithDetails) => (
    <Card
      key={order.id}
      className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.id}
          </h3>
          <p className="text-sm text-gray-500">
            {order.container_name || `Container ${order.container_id}`}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
          <span className="font-medium">From:</span>
          <span className="ml-1 truncate">{order.pickup_address}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
          <span className="font-medium">To:</span>
          <span className="ml-1 truncate">{order.drop_address}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
          <span className="font-semibold text-green-600">Rs. {order.price}</span>
          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
            {calculateDistance(
              order.pickup_lat,
              order.pickup_lng,
              order.drop_lat,
              order.drop_lng
            )} km
          </span>
        </div>

        {order.buyer_phone && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
            <span>{order.buyer_phone}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{getTimeAgo(order.created_at)}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        {renderOrderActions(order)}
      </div>
    </Card>
  ), [renderOrderActions]);

  if (state.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transport Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track all delivery orders</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={state.isRefreshing}
            variant="primary"
            icon={
              <ArrowPathIcon
                className={`h-5 w-5 ${state.isRefreshing ? 'animate-spin' : ''}`}
              />
            }
          >
            Refresh
          </Button>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {state.error}
          </div>
        )}

        {/* Orders Content */}
        {state.availableOrders.length === 0 ? (
          <Card className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <TruckIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Available</h3>
            <p className="text-gray-500">There are currently no orders to display.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.availableOrders.map(renderOrderCard)}
          </div>
        )}

        {/* Tracking Map */}
        {state.mapVisible && state.currentOrder && (
          <TrackingMap
            order={state.currentOrder}
            userLocation={state.userLocation}
            routeCoordinates={state.routeCoordinates}
            isTracking={state.isTracking}
            setMapVisible={closeMap}
            stopLocationTracking={stopLocationTracking}
            startLocationTracking={startLocationTracking}
            getCurrentLocation={getCurrentLocation}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Containers;