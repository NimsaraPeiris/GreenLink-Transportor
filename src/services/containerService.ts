import { supabase } from '../lib/supabase';

// Assign user and vehicle to container when order is confirmed
export async function assignContainer(
  containerId: string,
  userId: string,
  vehicleId: string
) {
  const { data, error } = await supabase
    .from('containers')
    .update({
      assigned_to: userId,
      vehicle_id: parseInt(vehicleId),
      status: 'active',
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    })
    .eq('id', containerId);

  if (error) throw new Error(`Error assigning container: ${error.message}`);
  return data;
}

// Unassign user and vehicle from container when order is completed
export async function unassignContainer(
  containerId: string,
  userId: string,
  vehicleId: string,
  orderId: string
) {
  const { data, error } = await supabase
    .from('containers')
    .update({
      assigned_to: null,
      vehicle_id: null,
      complete_order: parseInt(orderId),
      status: 'inactive',
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    })
    .eq('id', containerId);

  if (error) throw new Error(`Error unassigning container: ${error.message}`);
  return data;
}

// Update container location in real-time
export async function updateContainerLocation(
  containerId: string,
  latitude: number,
  longitude: number
) {
  const { data, error } = await supabase
    .from('containers')
    .update({
      latitude: latitude,
      longitude: longitude,
      last_updated: new Date().toISOString(),
    })
    .eq('id', containerId);

  if (error) throw new Error(`Error updating container location: ${error.message}`);
  return data;
}

// Get real-time container updates using Supabase subscriptions
export function subscribeToContainerUpdates(
  callback: (payload: any) => void
) {
  const subscription = supabase
    .channel('containers')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'containers'
      },
      callback
    )
    .subscribe();

  return subscription;
}

// Unsubscribe from real-time updates
export function unsubscribeFromContainerUpdates(subscription: any) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}
