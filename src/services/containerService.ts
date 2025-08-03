import { supabase } from '../lib/supabase';
import { Container } from '../types';

// Assign user and vehicle to container when order is confirmed
export async function assignContainer(
  containerId: string, // Container IDs are strings as per SQL sample
  userId: number,
  vehicleId: number
) {
  try {
    // Input validation
    if (!containerId || typeof containerId !== 'string') {
      throw new Error('Invalid container ID: must be a non-empty string');
    }
    
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      throw new Error('Invalid user ID: must be a positive number');
    }
    
    if (!vehicleId || typeof vehicleId !== 'number' || vehicleId <= 0) {
      throw new Error('Invalid vehicle ID: must be a positive number');
    }

    console.log('Assigning container:', { containerId, userId, vehicleId });

    const updatePayload = {
      assigned_to: userId, // INTEGER field
      vehicle_id: vehicleId, // INTEGER field
      status: 'active' as const,
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('containers')
      .update(updatePayload)
      .eq('id', containerId)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Error assigning container: ${error.message}`);
    }
    
    console.log('Container assigned successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in assignContainer:', error);
    throw error;
  }
}

// Unassign user and vehicle from container when order is completed
export async function unassignContainer(
  containerId: string, // Container IDs are strings as per SQL sample
  orderId: number
) {
  try {
    // Input validation
    if (!containerId || typeof containerId !== 'string') {
      throw new Error('Invalid container ID: must be a non-empty string');
    }
    
    if (!orderId || typeof orderId !== 'number' || orderId <= 0) {
      throw new Error('Invalid order ID: must be a positive number');
    }

    console.log('Unassigning container:', { containerId, orderId, types: { containerId: typeof containerId, orderId: typeof orderId } });

    const updatePayload = {
      assigned_to: null,
      vehicle_id: null,
      complete_order: orderId, // INTEGER field
      status: 'inactive' as const,
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    console.log('Update payload:', updatePayload);

    const { data, error } = await supabase
      .from('containers')
      .update(updatePayload)
      .eq('id', containerId)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Error unassigning container: ${error.message}`);
    }
    
    console.log('Container unassigned successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in unassignContainer:', error);
    throw error;
  }
}

// Update container real-time location (current_lat, current_lng)
export async function updateContainerLocation(
  containerId: string,
  latitude: number,
  longitude: number
) {
  try {
    const { data, error } = await supabase
      .from('containers')
      .update({
        current_lat: latitude, // Real-time location
        current_lng: longitude, // Real-time location
        last_updated: new Date().toISOString(),
      })
      .eq('id', containerId)
      .select('*')
      .single();

    if (error) throw new Error(`Error updating container location: ${error.message}`);
    
    // Emit real-time update to subscribers
    await supabase
      .channel('container-location-updates')
      .send({
        type: 'broadcast',
        event: 'location_update',
        payload: {
          container_id: containerId,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        }
      });

    return data;
  } catch (error) {
    console.error('Error in updateContainerLocation:', error);
    throw error;
  }
}

// Batch update multiple container locations
export async function updateMultipleContainerLocations(
  updates: Array<{
    containerId: string;
    latitude: number;
    longitude: number;
  }>
) {
  try {
    const promises = updates.map(update =>
      updateContainerLocation(update.containerId, update.latitude, update.longitude)
    );
    
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(result => result.status === 'fulfilled');
    const failed = results.filter(result => result.status === 'rejected');
    
    if (failed.length > 0) {
      console.warn(`${failed.length} location updates failed out of ${updates.length}`);
    }
    
    return {
      successful: successful.length,
      failed: failed.length,
      total: updates.length
    };
  } catch (error) {
    console.error('Error in updateMultipleContainerLocations:', error);
    throw error;
  }
}

// Get all containers with optional filters
export async function getContainers(filters?: {
  status?: 'active' | 'inactive';
  assigned_to?: number;
  vehicle_id?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('containers')
      .select(`
        *,
        users:assigned_to (
          id,
          email,
          full_name
        ),
        vehicles:vehicle_id (
          id,
          plate_number,
          model,
          capacity
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    
    if (filters?.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicle_id);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error fetching containers: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in getContainers:', error);
    throw error;
  }
}

// Get container by ID with related data
export async function getContainerById(containerId: string) {
  try {
    const { data, error } = await supabase
      .from('containers')
      .select(`
        *,
        users:assigned_to (
          id,
          email,
          full_name
        ),
        vehicles:vehicle_id (
          id,
          plate_number,
          model,
          capacity
        )
      `)
      .eq('id', containerId)
      .single();

    if (error) throw new Error(`Error fetching container: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in getContainerById:', error);
    throw error;
  }
}

// Update container sensor data (temperature, humidity, battery)
export async function updateContainerSensorData(
  containerId: string,
  sensorData: {
    temperature?: number;
    humidity?: number;
    battery_level?: number;
  }
) {
  try {
    const { data, error } = await supabase
      .from('containers')
      .update({
        ...sensorData,
        last_updated: new Date().toISOString(),
      })
      .eq('id', containerId)
      .select('*')
      .single();

    if (error) throw new Error(`Error updating container sensor data: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in updateContainerSensorData:', error);
    throw error;
  }
}

// Get real-time container updates using Supabase subscriptions
export function subscribeToContainerUpdates(
  callback: (payload: any) => void,
  containerId?: string
) {
  let channel = supabase
    .channel('containers')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'containers',
        ...(containerId && { filter: `id=eq.${containerId}` })
      },
      callback
    );

  return channel.subscribe();
}

// Subscribe to real-time location updates via broadcast
export function subscribeToLocationUpdates(
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel('container-location-updates')
    .on('broadcast', { event: 'location_update' }, callback);

  return channel.subscribe();
}

// Subscribe to container status changes
export function subscribeToContainerStatusUpdates(
  callback: (payload: any) => void,
  containerId?: string
) {
  let channel = supabase
    .channel('container-status')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'containers',
        ...(containerId && { filter: `id=eq.${containerId}` })
      },
      (payload) => {
        // Only trigger callback if status actually changed
        if (payload.new.status !== payload.old.status) {
          callback(payload);
        }
      }
    );

  return channel.subscribe();
}

// Unsubscribe from real-time updates
export function unsubscribeFromContainerUpdates(subscription: any) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}

// Create new container
export async function createContainer(containerData: {
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  temperature?: number;
  humidity?: number;
  battery_level?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('containers')
      .insert({
        ...containerData,
        status: 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw new Error(`Error creating container: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Error in createContainer:', error);
    throw error;
  }
}

// Get container tracking history (if you want to implement location history)
export async function getContainerTrackingHistory(
  containerId: string,
  limit: number = 100
) {
  try {
    // This would require a separate tracking_history table
    // For now, we'll return the current location
    const container = await getContainerById(containerId);
    
    return [{
      container_id: containerId,
      latitude: container.current_lat || container.latitude,
      longitude: container.current_lng || container.longitude,
      timestamp: container.last_updated,
    }];
  } catch (error) {
    console.error('Error in getContainerTrackingHistory:', error);
    throw error;
  }
}
