import { supabase } from '../lib/supabase';
import {
  takeOrder,
  confirmOrder,
  completeOrder,
  updateOrderStatus,
  subscribeToOrderUpdates,
  createOrder
} from './orderService';
import { 
  updateContainerLocation,
  subscribeToContainerUpdates,
  subscribeToLocationUpdates,
  getContainerById 
} from './containerService';

/**
 * Test Implementation for Order & Container Assignment System
 * 
 * This file demonstrates how to use the backend functionality for:
 * 1. Order status changes triggering container assignment/unassignment
 * 2. Real-time location updates
 * 3. WebSocket subscriptions for real-time updates
 */

// Example: Complete order workflow using takeOrder
export async function testOrderWorkflow() {
  console.log('🚀 Testing Order Workflow...');
  
  try {
    // Step 1: Create a new order
    const newOrder = await createOrder({
      user_id: 'user-uuid-123',
      container_id: '36', // Using container ID from your SQL sample
      pickup_address: 'Colombo, Sri Lanka',
      pickup_lat: 6.9271,
      pickup_lng: 79.8612,
      drop_address: 'Kandy, Sri Lanka',
      drop_lat: 7.2906,
      drop_lng: 80.6337,
      price: 1500,
      buyer_phone: '+94771234567',
      notes: 'Handle with care'
    });
    
    console.log('✅ Order created:', newOrder);
    
    // Step 2: Take order (this will trigger container assignment)
    const takenOrder = await takeOrder(
      newOrder.id,
      96, // current user ID (transporter) - using numeric ID from SQL sample
      1 // vehicle_id
    );
    
    console.log('✅ Order taken - Container should now be assigned:', takenOrder);
    
    // Step 3: Simulate location updates during transit
    await simulateLocationUpdates(newOrder.container_id);
    
    // Step 4: Complete order (this will trigger container unassignment)
    const completedOrder = await completeOrder(newOrder.id);
    
    console.log('✅ Order completed - Container should now be unassigned:', completedOrder);
    
    return {
      created: newOrder,
      taken: takenOrder,
      completed: completedOrder
    };
    
  } catch (error) {
    console.error('❌ Error in order workflow:', error);
    throw error;
  }
}

// Example: Simulate real-time location updates
export async function simulateLocationUpdates(containerId: string) {
  console.log('📍 Simulating location updates for container:', containerId);
  
  // Route from Colombo to Kandy (simplified)
  const routePoints = [
    { lat: 6.9271, lng: 79.8612, location: 'Colombo - Starting point' },
    { lat: 7.0500, lng: 79.9500, location: 'Leaving Colombo' },
    { lat: 7.1500, lng: 80.1000, location: 'Kegalle area' },
    { lat: 7.2000, lng: 80.3000, location: 'Approaching Kandy' },
    { lat: 7.2906, lng: 80.6337, location: 'Kandy - Destination' }
  ];
  
  try {
    for (let i = 0; i < routePoints.length; i++) {
      const point = routePoints[i];
      
      // Update container location
      await updateContainerLocation(containerId, point.lat, point.lng);
      
      console.log(`📍 Location updated: ${point.location} (${point.lat}, ${point.lng})`);
      
      // Wait 2 seconds between updates (in real scenario, this would be based on GPS updates)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('✅ Location simulation completed');
  } catch (error) {
    console.error('❌ Error updating locations:', error);
    throw error;
  }
}

// Example: Set up real-time subscriptions
export function setupRealTimeSubscriptions() {
  console.log('🔔 Setting up real-time subscriptions...');
  
  // Subscribe to order updates
  const orderSubscription = subscribeToOrderUpdates((payload) => {
    console.log('📦 Order Update:', {
      orderId: payload.new.id,
      oldStatus: payload.old.status,
      newStatus: payload.new.status,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific status changes
    if (payload.new.status === 'confirmed' && payload.old.status !== 'confirmed') {
      console.log('🎉 Order confirmed! Container assignment triggered.');
    }
    
    if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
      console.log('🏁 Order completed! Container unassignment triggered.');
    }
  });
  
  // Subscribe to container updates
  const containerSubscription = subscribeToContainerUpdates((payload) => {
    console.log('📦 Container Update:', {
      containerId: payload.new.id,
      oldStatus: payload.old.status,
      newStatus: payload.new.status,
      oldAssignedTo: payload.old.assigned_to,
      newAssignedTo: payload.new.assigned_to,
      oldVehicleId: payload.old.vehicle_id,
      newVehicleId: payload.new.vehicle_id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Subscribe to location updates
  const locationSubscription = subscribeToLocationUpdates((payload) => {
    console.log('📍 Location Update:', {
      containerId: payload.payload.container_id,
      latitude: payload.payload.latitude,
      longitude: payload.payload.longitude,
      timestamp: payload.payload.timestamp
    });
  });
  
  console.log('✅ Real-time subscriptions active');
  
  return {
    orderSubscription,
    containerSubscription,
    locationSubscription
  };
}

// Example: Test container sensor data updates
export async function testSensorDataUpdates(containerId: string) {
  console.log('🌡️ Testing sensor data updates...');
  
  try {
    // Simulate sensor readings over time
    const sensorReadings = [
      { temperature: 22.5, humidity: 45.2, battery_level: 95 },
      { temperature: 23.1, humidity: 47.8, battery_level: 92 },
      { temperature: 24.0, humidity: 50.1, battery_level: 89 },
      { temperature: 25.2, humidity: 52.5, battery_level: 86 }
    ];
    
    for (const reading of sensorReadings) {
      const { updateContainerSensorData } = await import('./containerService');
      
      await updateContainerSensorData(containerId, reading);
      
      console.log(`🌡️ Sensor data updated:`, reading);
      
      // Wait 3 seconds between readings
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('✅ Sensor data simulation completed');
  } catch (error) {
    console.error('❌ Error updating sensor data:', error);
    throw error;
  }
}

// Example: Comprehensive test function
export async function runComprehensiveTest() {
  console.log('🧪 Running Comprehensive Test Suite...');
  
  try {
    // 1. Set up real-time subscriptions first
    const subscriptions = setupRealTimeSubscriptions();
    
    // 2. Test the complete order workflow
    const orderResults = await testOrderWorkflow();
    
    // 3. Test sensor data updates
    await testSensorDataUpdates(orderResults.created.container_id);
    
    // 4. Verify final container state
    const finalContainerState = await getContainerById(orderResults.created.container_id);
    console.log('📦 Final container state:', finalContainerState);
    
    console.log('✅ All tests completed successfully!');
    
    // Clean up subscriptions (in a real app, you'd do this on component unmount)
    setTimeout(() => {
      console.log('🧹 Cleaning up subscriptions...');
      supabase.removeChannel(subscriptions.orderSubscription);
      supabase.removeChannel(subscriptions.containerSubscription);
      supabase.removeChannel(subscriptions.locationSubscription);
    }, 10000); // Clean up after 10 seconds
    
    return {
      orderResults,
      finalContainerState,
      subscriptions
    };
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    throw error;
  }
}

// Example: Manual testing functions for development
export const testFunctions = {
  // Test order status changes
  async testOrderStatusChange(orderId: number, newStatus: string) {
    return await updateOrderStatus(orderId, newStatus as any);
  },
  
  // Test location update
  async testLocationUpdate(containerId: string, lat: number, lng: number) {
    return await updateContainerLocation(containerId, lat, lng);
  },
  
  // Test container retrieval
  async testGetContainer(containerId: string) {
    return await getContainerById(containerId);
  }
};

// Usage examples for the frontend:
/*

// In a React component:
import { runComprehensiveTest, setupRealTimeSubscriptions } from '../services/testImplementation';

// Run the full test
const handleRunTest = async () => {
  try {
    const results = await runComprehensiveTest();
    console.log('Test results:', results);
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Set up real-time updates in useEffect
useEffect(() => {
  const subscriptions = setupRealTimeSubscriptions();
  
  return () => {
    // Cleanup on unmount
    supabase.removeChannel(subscriptions.orderSubscription);
    supabase.removeChannel(subscriptions.containerSubscription);
    supabase.removeChannel(subscriptions.locationSubscription);
  };
}, []);

// Manual order taking
const handleTakeOrder = async (orderId, currentUserId, vehicleId) => {
  try {
    const result = await takeOrder(orderId, currentUserId, vehicleId);
    console.log('Order taken:', result);
  } catch (error) {
    console.error('Failed to take order:', error);
  }
};

// Manual order confirmation (legacy)
const handleConfirmOrder = async (orderId, vehicleId, transporterId) => {
  try {
    const result = await confirmOrder(orderId, vehicleId, transporterId);
    console.log('Order confirmed:', result);
  } catch (error) {
    console.error('Failed to confirm order:', error);
  }
};

// Manual location update (from GPS device)
const handleLocationUpdate = async (containerId, latitude, longitude) => {
  try {
    const result = await updateContainerLocation(containerId, latitude, longitude);
    console.log('Location updated:', result);
  } catch (error) {
    console.error('Failed to update location:', error);
  }
};

*/