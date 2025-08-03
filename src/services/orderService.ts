import { supabase } from '../lib/supabase';
import { Order } from '../types';

// Update order status and trigger container assignment/unassignment
export async function updateOrderStatus(
  orderId: number,
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled',
  vehicleId?: number
) {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // If confirming order and vehicle is provided, assign vehicle
    if (status === 'confirmed' && vehicleId) {
      updateData.vehicle_id = vehicleId;
      updateData.assigned_at = new Date().toISOString();
    }

    // If completing order, set delivery time
    if (status === 'completed') {
      updateData.delivery_time = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw new Error(`Error updating order status: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
}

// Take order - confirm order and assign container/vehicle to current user
export async function takeOrder(
  orderId: number,
  currentUserId: number,
  vehicleId: number
) {
  try {
    // Input validation
    if (!orderId || typeof orderId !== 'number' || orderId <= 0) {
      throw new Error('Invalid order ID: must be a positive number');
    }
    
    if (!currentUserId || typeof currentUserId !== 'number' || currentUserId <= 0) {
      throw new Error('Invalid user ID: must be a positive number');
    }
    
    if (!vehicleId || typeof vehicleId !== 'number' || vehicleId <= 0) {
      throw new Error('Invalid vehicle ID: must be a positive number');
    }

    console.log('Taking order:', { orderId, currentUserId, vehicleId });

    // First get the order to get container_id
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('container_id')
      .eq('id', orderId)
      .single();

    if (orderError) throw new Error(`Error fetching order: ${orderError.message}`);
    
    if (!orderData?.container_id) {
      throw new Error('Order does not have a container assigned');
    }

    console.log('Order data:', orderData);

    // Update order status to confirmed and assign transporter and vehicle
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        vehicle_id: vehicleId,
        transporter_id: currentUserId, // Now correctly a number (int8)
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) throw new Error(`Error taking order: ${updateError.message}`);

    // Use the assignContainer function with proper validation
    const { assignContainer } = await import('./containerService');
    await assignContainer(orderData.container_id, currentUserId, vehicleId);
    
    console.log('Order taken successfully:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error in takeOrder:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function confirmOrder(
  orderId: number,
  vehicleId: number,
  transporterId: number
) {
  return takeOrder(orderId, transporterId, vehicleId);
}

// Complete order and unassign container/vehicle
export async function completeOrder(orderId: number) {
  try {
    // Input validation
    if (!orderId || typeof orderId !== 'number' || orderId <= 0) {
      throw new Error('Invalid order ID: must be a positive number');
    }

    console.log('Completing order:', orderId);

    // First get the order to get container_id
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('container_id')
      .eq('id', orderId)
      .single();

    if (orderError) throw new Error(`Error fetching order: ${orderError.message}`);
    
    if (!orderData?.container_id) {
      throw new Error('Order does not have a container assigned');
    }

    console.log('Order data:', orderData);

    // Update order status to completed
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        delivery_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) throw new Error(`Error completing order: ${updateError.message}`);

    // Use the unassignContainer function with proper validation
    const { unassignContainer } = await import('./containerService');
    await unassignContainer(orderData.container_id, orderId);
    
    console.log('Order completed successfully:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error in completeOrder:', error);
    throw error;
  }
}

// Get order with container and vehicle details
export async function getOrderWithDetails(orderId: number) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        containers:container_id (
          id,
          name,
          status,
          current_lat,
          current_lng,
          latitude,
          longitude,
          location,
          temperature,
          humidity,
          battery_level
        ),
        vehicles:vehicle_id (
          id,
          plate_number,
          model,
          capacity
        ),
        users:user_id (
          id,
          email,
          full_name
        ),
        transporter:transporter_id (
          id,
          email,
          full_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw new Error(`Error fetching order details: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in getOrderWithDetails:', error);
    throw error;
  }
}

// Get all orders with filters
export async function getOrders(filters?: {
  status?: string;
  user_id?: string;
  transporter_id?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        containers:container_id (
          id,
          name,
          status,
          current_lat,
          current_lng,
          location
        ),
        vehicles:vehicle_id (
          id,
          plate_number,
          model
        ),
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    if (filters?.transporter_id) {
      query = query.eq('transporter_id', filters.transporter_id);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error fetching orders: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in getOrders:', error);
    throw error;
  }
}

// Subscribe to order status changes
export function subscribeToOrderUpdates(
  callback: (payload: any) => void,
  orderId?: number
) {
  let channel = supabase
    .channel('orders')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        ...(orderId && { filter: `id=eq.${orderId}` })
      },
      callback
    );

  return channel.subscribe();
}

// Unsubscribe from order updates
export function unsubscribeFromOrderUpdates(subscription: any) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}

// Create new order
export async function createOrder(orderData: {
  user_id: string;
  container_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_address: string;
  drop_lat: number;
  drop_lng: number;
  price: number;
  buyer_phone?: string;
  notes?: string;
  route_geometry?: any;
}) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw new Error(`Error creating order: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
}

// Update order location during transit
export async function updateOrderLocation(
  orderId: number,
  latitude: number,
  longitude: number
) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        current_lat: latitude,
        current_lng: longitude,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw new Error(`Error updating order location: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in updateOrderLocation:', error);
    throw error;
  }
}