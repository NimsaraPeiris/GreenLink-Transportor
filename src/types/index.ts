export interface users {
  id: number;
  name?: string;
  email: string;
  role?: string;
  // created_at: string;
}

export interface vehicles {
  id: number;
  transporter_id: string;
  plate_number: string;
  model: string;
  capacity: number;
  created_at: string;
}

export interface containers {
  id: number;
  name: string;
  location?: string; // Legacy location field
  latitude?: number;  // Static latitude
  longitude?: number; // Static longitude
  status: 'active' | 'inactive';
  last_updated: string;
  assigned_to: number | null; // Using assigned_to as per SQL sample (numeric user ID)
  vehicle_id: number | null; // Vehicle ID assigned to this container
  complete_order: boolean | null;
  temperature: number;
  humidity: number;
  battery_level: number;
  created_at: string;
  updated_at: string;
}

export interface orders {
  id: number;
  user_id: number; // int8 (bigint)
  container_id: string; // int8 (bigint)
  status: 'pending' | 'confirmed' | 'completed';
  price: number;
  created_at: string;
  updated_at: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_address: string;
  drop_lat: number;
  drop_lng: number;
  route_geometry?: {
    type: string;
    coordinates: number[][];
  };
  current_lat?: number;
  current_lng?: number;
  buyer_phone?: string;
  notes?: string;
  
  containers?: { // This represents the joined container data
    id: string;
    name: string;
    status: string;
    current_lat?: number;
    current_lng?: number;
    latitude?: number;
    longitude?: number;
    location?: string;
    temperature?: number;
    humidity?: number;
    battery_level?: number;
  };
  vehicles?: { // Vehicle data when joined
    id: number;
    plate_number: string;
    model: string;
    capacity: number;
  };
  users?: { // User data when joined
    id: number;
    email: string;
    full_name?: string;
  };
  transporter?: { // Transporter data when joined
    id: number;
    email: string;
    full_name?: string;
  };
}

export interface OrderWithDetails extends orders {
  container_name?: string;
  user_name?: string;
}

export interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku: string;
}

// Location update payload for real-time tracking
export interface LocationUpdate {
  container_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Real-time subscription payloads
export interface ContainerUpdatePayload {
  eventType: 'UPDATE';
  new: containers;
  old: containers;
  schema: string;
  table: string;
}

export interface OrderUpdatePayload {
  eventType: 'UPDATE';
  new: orders;
  old: orders;
  schema: string;
  table: string;
}

// Notification interface
export interface Notification {
  id: string;
  type: string;
  message: string;
  link: string;
  entity_id: string;
  entity_type: string;
  is_read: boolean;
  created_at: string;
}

// Dashboard stats interface
export interface DashboardStats {
  total_orders: number;
  active_containers: number;
  total_containers: number;
  total_revenue: number;
  orders_by_status: Record<string, number>;
  containers_by_status: {
    active: number;
    inactive: number;
    warning: number;
  };
  monthly_orders: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
  recent_orders: Array<orders>;
  recent_containers: Array<containers>;
  top_locations: Array<{
    location: string;
    count: number;
  }>;
  delivery_metrics: {
    on_time: number;
    delayed: number;
    total: number;
  };
  container_metrics: {
    temperature_avg: number;
    humidity_avg: number;
    battery_level_avg: number;
  };
  on_time_deliveries_percent: number;
}
