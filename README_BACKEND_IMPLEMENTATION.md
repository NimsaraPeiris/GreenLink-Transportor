# Backend Functionality: Order & Container Assignment System

This document describes the implementation of backend functionality for assigning and unassigning users and vehicles to containers based on order status changes, along with real-time location tracking.

## 🎯 Overview

The system automatically handles:
- **Container Assignment**: When an order is confirmed, assign user and vehicle to container
- **Container Unassignment**: When an order is completed, unassign user and vehicle from container
- **Real-time Location Updates**: Track container locations and broadcast updates to frontend
- **WebSocket Communication**: Real-time updates using Supabase subscriptions

## 📋 Features Implemented

### ✅ Database Schema
- Updated database schema with proper relationships
- Added database triggers for automatic assignment/unassignment
- Proper UUID handling for users and containers
- Real-time location fields (`current_lat`, `current_lng`)

### ✅ Order Management
- Order status change handling
- Automatic container assignment on order confirmation
- Automatic container unassignment on order completion
- Real-time order updates via WebSocket

### ✅ Container Management
- Real-time location updates
- Container status management
- Sensor data updates (temperature, humidity, battery)
- WebSocket subscriptions for container changes

### ✅ Real-time Communication
- Supabase real-time subscriptions
- Location broadcast updates
- Order status change notifications
- Container assignment/unassignment events

## 🗄️ Database Schema

### Key Tables

#### `orders`
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    container_id UUID REFERENCES containers(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled')),
    -- ... other fields
);
```

#### `containers`
```sql
CREATE TABLE containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id), -- Assigned user
    vehicle_id INTEGER REFERENCES vehicles(id), -- Assigned vehicle
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'warning')),
    current_lat DECIMAL(10,8), -- Real-time latitude
    current_lng DECIMAL(11,8), -- Real-time longitude
    -- ... other fields
);
```

### Database Triggers

The system uses PostgreSQL triggers to automatically handle container assignment:

```sql
-- Trigger function for order status changes
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When order status changes to 'confirmed'
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE containers 
        SET 
            user_id = NEW.user_id,
            vehicle_id = NEW.vehicle_id,
            status = 'active'
        WHERE id = NEW.container_id;
    END IF;
    
    -- When order status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE containers 
        SET 
            user_id = NULL,
            vehicle_id = NULL,
            status = 'inactive'
        WHERE id = NEW.container_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';
```

## 🔧 Services Implementation

### Order Service (`src/services/orderService.ts`)

#### Key Functions:

```typescript
// Confirm order and assign container/vehicle
export async function confirmOrder(
  orderId: number,
  vehicleId: number,
  transporterId: string
): Promise<Order>

// Complete order and unassign container/vehicle
export async function completeOrder(orderId: number): Promise<Order>

// Subscribe to order status changes
export function subscribeToOrderUpdates(
  callback: (payload: any) => void,
  orderId?: number
): Subscription
```

### Container Service (`src/services/containerService.ts`)

#### Key Functions:

```typescript
// Update container real-time location
export async function updateContainerLocation(
  containerId: string,
  latitude: number,
  longitude: number
): Promise<Container>

// Subscribe to container updates
export function subscribeToContainerUpdates(
  callback: (payload: any) => void,
  containerId?: string
): Subscription

// Subscribe to real-time location updates
export function subscribeToLocationUpdates(
  callback: (payload: any) => void
): Subscription
```

## 🎣 React Hook Implementation

### `useOrderContainerManagement`

A comprehensive React hook that provides:

```typescript
const {
  order,
  container,
  loading,
  error,
  locationHistory,
  confirmOrder,
  completeOrder,
  updateLocation,
  isOrderActive,
  isContainerAssigned,
  currentLocation
} = useOrderContainerManagement({ 
  orderId, 
  containerId,
  enableRealTimeUpdates: true 
});
```

## 🚀 Usage Examples

### 1. Order Workflow

```typescript
import { confirmOrder, completeOrder } from '../services/orderService';

// Confirm order (triggers container assignment)
const confirmedOrder = await confirmOrder(
  orderId,
  vehicleId,
  transporterId
);

// Complete order (triggers container unassignment)
const completedOrder = await completeOrder(orderId);
```

### 2. Real-time Location Updates

```typescript
import { updateContainerLocation } from '../services/containerService';

// Update container location (from GPS device)
await updateContainerLocation(
  containerId,
  latitude,
  longitude
);
```

### 3. Real-time Subscriptions

```typescript
import { 
  subscribeToOrderUpdates,
  subscribeToLocationUpdates 
} from '../services/orderService';

// Subscribe to order changes
const orderSub = subscribeToOrderUpdates((payload) => {
  console.log('Order status changed:', payload.new.status);
});

// Subscribe to location updates
const locationSub = subscribeToLocationUpdates((payload) => {
  console.log('Location updated:', payload.payload);
});
```

### 4. React Component Usage

```typescript
function OrderTrackingComponent({ orderId }: { orderId: number }) {
  const {
    order,
    container,
    confirmOrder,
    completeOrder,
    updateLocation,
    isOrderActive,
    currentLocation
  } = useOrderContainerManagement({ orderId });

  const handleConfirm = async () => {
    await confirmOrder(orderId, vehicleId, transporterId);
  };

  const handleComplete = async () => {
    await completeOrder(orderId);
  };

  return (
    <div>
      <h2>Order #{order?.id}</h2>
      <p>Status: {order?.status}</p>
      
      {container && (
        <div>
          <h3>Container: {container.name}</h3>
          <p>Status: {container.status}</p>
          {currentLocation && (
            <p>Location: {currentLocation.lat}, {currentLocation.lng}</p>
          )}
        </div>
      )}
      
      <button onClick={handleConfirm} disabled={order?.status !== 'pending'}>
        Confirm Order
      </button>
      <button onClick={handleComplete} disabled={!isOrderActive}>
        Complete Order
      </button>
    </div>
  );
}
```

## 🧪 Testing

### Test Implementation (`src/services/testImplementation.ts`)

The test file provides comprehensive testing functions:

```typescript
import { runComprehensiveTest } from '../services/testImplementation';

// Run complete test suite
const results = await runComprehensiveTest();
```

### Test Functions Available:

1. **`testOrderWorkflow()`** - Complete order lifecycle test
2. **`simulateLocationUpdates()`** - GPS tracking simulation
3. **`setupRealTimeSubscriptions()`** - WebSocket testing
4. **`testSensorDataUpdates()`** - Container sensor testing
5. **`runComprehensiveTest()`** - Full system test

## 📡 Real-time Communication Flow

### Order Confirmation Flow:
1. Frontend calls `confirmOrder()`
2. Database trigger updates container assignment
3. WebSocket broadcasts container update
4. Frontend receives real-time update
5. UI updates automatically

### Location Update Flow:
1. GPS device sends location data
2. Backend calls `updateContainerLocation()`
3. Database updates `current_lat`/`current_lng`
4. WebSocket broadcasts location update
5. Frontend receives real-time location
6. Map updates automatically

## 🔒 Security Considerations

- Row Level Security (RLS) enabled on all tables
- User authentication required for all operations
- Container assignment restricted to authorized users
- Real-time subscriptions filtered by user permissions

## 🚀 Deployment Notes

### Database Setup:
1. Run the schema SQL file: `supabase/schema.sql`
2. Ensure all triggers are created
3. Set up RLS policies
4. Configure real-time subscriptions

### Environment Variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Performance Considerations

- **Batch Location Updates**: Use `updateMultipleContainerLocations()` for bulk updates
- **Subscription Management**: Properly cleanup subscriptions to prevent memory leaks
- **Database Indexing**: Ensure proper indexes on frequently queried fields
- **Real-time Throttling**: Consider throttling location updates to prevent spam

## 🔄 Future Enhancements

1. **Location History**: Store historical location data
2. **Geofencing**: Alert when containers enter/exit zones
3. **Route Optimization**: Suggest optimal routes
4. **Predictive Analytics**: ETA calculations
5. **Mobile Push Notifications**: Real-time alerts
6. **Offline Support**: Handle network disconnections

## 📝 API Reference

### Order Status Values:
- `pending` - Order created, awaiting confirmation
- `confirmed` - Order confirmed, container assigned
- `processing` - Order being processed
- `shipped` - Order shipped
- `delivered` - Order delivered
- `completed` - Order completed, container unassigned
- `cancelled` - Order cancelled

### Container Status Values:
- `active` - Container assigned and in use
- `inactive` - Container available for assignment
- `warning` - Container has issues (low battery, etc.)

## 🐛 Troubleshooting

### Common Issues:

1. **Container not assigning**: Check database triggers are created
2. **Real-time not working**: Verify Supabase real-time is enabled
3. **Location not updating**: Check `current_lat`/`current_lng` fields exist
4. **TypeScript errors**: Ensure all types are properly imported

### Debug Commands:

```sql
-- Check container assignments
SELECT c.name, c.status, c.user_id, c.vehicle_id 
FROM containers c 
WHERE c.id = 'container-id';

-- Check order status
SELECT id, status, container_id, vehicle_id 
FROM orders 
WHERE id = order_id;
```

## 📞 Support

For issues or questions about this implementation:
1. Check the test implementation file for examples
2. Review the database schema for proper setup
3. Ensure all services are properly imported
4. Verify Supabase configuration is correct

---

**Implementation Status**: ✅ Complete
**Last Updated**: 2025-08-03
**Version**: 1.0.0