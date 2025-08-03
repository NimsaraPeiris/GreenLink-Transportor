# Order Management System Implementation

This document explains the complete implementation of the order management system that handles taking orders and completing them with automatic container assignment/unassignment.

## Overview

The system implements the following workflow:
1. **Take Order**: When a transporter clicks "Take Order", the order status changes to "confirmed" and the container is assigned to the current user with their vehicle
2. **Complete Order**: When the transporter clicks "Complete Order", the order status changes to "completed" and the container is unassigned (assigned_to and vehicle_id become null)

## Database Structure

### Orders Table
```sql
- id: SERIAL PRIMARY KEY
- user_id: UUID (customer who created the order)
- container_id: UUID (container assigned to this order)
- status: VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'))
- transporter_id: UUID (transporter who took the order)
- vehicle_id: INTEGER (vehicle assigned to the order)
- assigned_at: TIMESTAMP (when order was taken)
- delivery_time: TIMESTAMP (when order was completed)
```

### Containers Table
```sql
- id: UUID PRIMARY KEY
- name: VARCHAR(100)
- assigned_to: UUID (user who is currently assigned to this container)
- vehicle_id: INTEGER (vehicle currently assigned to this container)
- status: VARCHAR(20) CHECK (status IN ('active', 'inactive', 'warning'))
- complete_order: INTEGER (last completed order ID)
```

## Core Functions

### 1. Take Order (`takeOrder`)
```typescript
export async function takeOrder(
  orderId: number,
  currentUserId: string,
  vehicleId: number
)
```

**What it does:**
- Updates order status to "confirmed"
- Sets transporter_id to current user
- Sets vehicle_id to selected vehicle
- Updates container's assigned_to to current user
- Updates container's vehicle_id to selected vehicle
- Sets container status to "active"

### 2. Complete Order (`completeOrder`)
```typescript
export async function completeOrder(orderId: number)
```

**What it does:**
- Updates order status to "completed"
- Sets delivery_time to current timestamp
- Sets container's assigned_to to null
- Sets container's vehicle_id to null
- Sets container status to "inactive"
- Records the completed order ID in container's complete_order field

## React Hook Usage

### useOrderContainerManagement Hook

```typescript
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
```

**Key Features:**
- Real-time updates via Supabase subscriptions
- Automatic container loading when order changes
- Error handling and loading states
- Location tracking support

## Component Usage

### OrderManagement Component

```typescript
import OrderManagement from '../components/orders/OrderManagement';

<OrderManagement 
  orderId={131} 
  onOrderUpdated={() => console.log('Order updated')} 
/>
```

**Features:**
- Complete order information display
- Container status and sensor data
- Vehicle selection for taking orders
- Take/Complete order buttons with proper state management
- Real-time updates
- Order timeline
- Error handling

## Example Implementation

### 1. Taking an Order

```typescript
// In a React component
const handleTakeOrder = async () => {
  const currentUserId = user.id; // From auth context
  const selectedVehicleId = 1; // From vehicle selector
  const orderId = 131; // Order to take

  try {
    await takeOrder(orderId, currentUserId, selectedVehicleId);
    console.log('Order taken successfully!');
    // Order status: pending → confirmed
    // Container assigned_to: null → currentUserId
    // Container vehicle_id: null → selectedVehicleId
    // Container status: inactive → active
  } catch (error) {
    console.error('Failed to take order:', error);
  }
};
```

### 2. Completing an Order

```typescript
const handleCompleteOrder = async () => {
  const orderId = 131; // Order to complete

  try {
    await completeOrder(orderId);
    console.log('Order completed successfully!');
    // Order status: confirmed → completed
    // Container assigned_to: currentUserId → null
    // Container vehicle_id: selectedVehicleId → null
    // Container status: active → inactive
  } catch (error) {
    console.error('Failed to complete order:', error);
  }
};
```

## Database Triggers (Automatic)

The system includes database triggers that automatically handle container assignment:

```sql
-- When order status changes to 'confirmed'
UPDATE containers 
SET 
    assigned_to = NEW.transporter_id,
    vehicle_id = NEW.vehicle_id,
    status = 'active',
    last_updated = NOW()
WHERE id = NEW.container_id;

-- When order status changes to 'completed'
UPDATE containers 
SET 
    assigned_to = NULL,
    vehicle_id = NULL,
    status = 'inactive',
    complete_order = NEW.id,
    last_updated = NOW()
WHERE id = NEW.container_id;
```

## Real-time Updates

The system supports real-time updates through Supabase subscriptions:

```typescript
// Order updates
subscribeToOrderUpdates((payload) => {
  console.log('Order status changed:', payload.new.status);
});

// Container updates
subscribeToContainerUpdates((payload) => {
  console.log('Container assignment changed:', {
    assigned_to: payload.new.assigned_to,
    vehicle_id: payload.new.vehicle_id
  });
});
```

## Testing

### Manual Testing

```typescript
import { testOrderWorkflow } from '../services/testImplementation';

// Run complete workflow test
const runTest = async () => {
  try {
    const results = await testOrderWorkflow();
    console.log('Test completed:', results);
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

### Test Data

Using the provided SQL samples:
- Order ID: 131
- Container ID: '36'
- User ID: '96'

## Error Handling

Common errors and solutions:

1. **Check constraint violation**: Ensure order status values match database constraints
2. **Foreign key violations**: Verify user_id, container_id, and vehicle_id exist
3. **Permission errors**: Check RLS policies for proper access control

## Security

- Row Level Security (RLS) policies ensure users can only access their own data
- Transporters can only update containers they're assigned to
- Order updates require proper user authentication

## Integration with Frontend

The system integrates seamlessly with:
- Authentication context for current user
- Vehicle management for vehicle selection
- Real-time notifications
- Location tracking
- Dashboard statistics

## Performance Considerations

- Database triggers handle assignment automatically
- Subscriptions provide real-time updates without polling
- Efficient queries with proper indexing
- Batch operations for multiple updates

This implementation provides a complete, production-ready order management system with proper error handling, real-time updates, and security measures.