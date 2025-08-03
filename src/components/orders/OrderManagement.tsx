import React, { useState, useEffect } from 'react';
import { useOrderContainerManagement } from '../../hooks/useOrderContainerManagement';
import { useAuth } from '../../contexts/AuthContext';
import { useVehicles } from '../../hooks/useVehicles';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import VehicleSelector from '../ui/VehicleSelector';

interface OrderManagementProps {
  orderId: number;
  onOrderUpdated?: () => void;
}

export function OrderManagement({ orderId, onOrderUpdated }: OrderManagementProps) {
  const { user } = useAuth();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const {
    order,
    container,
    loading,
    error,
    takeOrder,
    completeOrder,
    isOrderActive,
    isContainerAssigned,
    currentLocation,
    clearError
  } = useOrderContainerManagement({
    orderId,
    enableRealTimeUpdates: true
  });

  // Update container ID when order is loaded
  useEffect(() => {
    if (order?.container_id) {
      // The hook will automatically load the container when containerId changes
    }
  }, [order?.container_id]);

  // Auto-select first vehicle if available
  useEffect(() => {
    if (vehicles && vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id.toString());
    }
  }, [vehicles, selectedVehicleId]);

  const handleTakeOrder = async () => {
    if (!user?.id || !selectedVehicleId) {
      alert('Please select a vehicle and ensure you are logged in');
      return;
    }

    try {
      // For now, use sample user ID from your SQL data
      // In production, you'd fetch the numeric user ID from your users table
      const numericUserId = 96; // Using sample user ID from your SQL
      
      await takeOrder(orderId, numericUserId, parseInt(selectedVehicleId));
      onOrderUpdated?.();
      alert('Order taken successfully! Container has been assigned to you.');
    } catch (error) {
      console.error('Failed to take order:', error);
      alert('Failed to take order. Please try again.');
    }
  };

  const handleCompleteOrder = async () => {
    try {
      await completeOrder(orderId);
      onOrderUpdated?.();
      alert('Order completed successfully! Container has been unassigned.');
    } catch (error) {
      console.error('Failed to complete order:', error);
      alert('Failed to complete order. Please try again.');
    }
  };

  if (loading || vehiclesLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="text-red-800">
          <h3 className="font-semibold mb-2">Error</h3>
          <p className="text-sm mb-4">{error}</p>
          <Button onClick={clearError} variant="outline" size="sm">
            Clear Error
          </Button>
        </div>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Order not found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Information */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Order #{order.id}</h2>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Pickup</h3>
            <p className="text-sm text-gray-600">{order.pickup_address}</p>
            <p className="text-xs text-gray-500">
              {order.pickup_lat}, {order.pickup_lng}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Drop-off</h3>
            <p className="text-sm text-gray-600">{order.drop_address}</p>
            <p className="text-xs text-gray-500">
              {order.drop_lat}, {order.drop_lng}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Price:</span>
            <p className="font-medium">${order.price}</p>
          </div>
          <div>
            <span className="text-gray-500">Payment:</span>
            <p className="font-medium capitalize">{order.payment_status}</p>
          </div>
          <div>
            <span className="text-gray-500">Phone:</span>
            <p className="font-medium">{order.buyer_phone || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <p className="font-medium">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <span className="text-gray-500 text-sm">Notes:</span>
            <p className="text-sm mt-1">{order.notes}</p>
          </div>
        )}
      </Card>

      {/* Container Information */}
      {container && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Container: {container.name}</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <span className="text-gray-500 text-sm">Status:</span>
              <p className="font-medium capitalize">{container.status}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Temperature:</span>
              <p className="font-medium">{container.temperature}°C</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Humidity:</span>
              <p className="font-medium">{container.humidity}%</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Battery:</span>
              <p className="font-medium">{container.battery_level}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Assigned To:</span>
              <p className="font-medium">
                {isContainerAssigned ? 'Assigned' : 'Unassigned'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Vehicle:</span>
              <p className="font-medium">
                {container.vehicle_id ? `Vehicle #${container.vehicle_id}` : 'None'}
              </p>
            </div>
          </div>

          {currentLocation && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <span className="text-blue-700 text-sm font-medium">Current Location:</span>
              <p className="text-blue-600 text-sm">
                {currentLocation.lat}, {currentLocation.lng}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        
        {order.status === 'pending' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vehicle
              </label>
              <VehicleSelector
                vehicles={vehicles || []}
                selectedVehicleId={selectedVehicleId}
                onVehicleSelect={setSelectedVehicleId}
              />
            </div>
            
            <Button
              onClick={handleTakeOrder}
              disabled={!selectedVehicleId || !user?.id}
              className="w-full md:w-auto"
            >
              Take Order
            </Button>
          </div>
        )}

        {isOrderActive && (
          <Button
            onClick={handleCompleteOrder}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            Complete Order
          </Button>
        )}

        {order.status === 'completed' && (
          <div className="text-green-600 font-medium">
            ✅ Order completed successfully
          </div>
        )}
      </Card>

      {/* Order Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">Order Created</p>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {order.assigned_at && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Order Taken</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.assigned_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {order.pickup_time && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Pickup Completed</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.pickup_time).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {order.delivery_time && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Delivery Completed</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.delivery_time).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default OrderManagement;