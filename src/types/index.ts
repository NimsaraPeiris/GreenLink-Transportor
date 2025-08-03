export interface User {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
  company?: string;
  role?: string;
  created_at: string;
}

export interface Container {
  id: number;
  name: string;
  location?: string; // Legacy location field
  latitude?: number;  // Current latitude
  longitude?: number; // Current longitude
  status: 'active' | 'inactive' | 'warning';
  last_updated: string;
  assigned_to: string | null; // User ID who is assigned to this container
  vehicle_id: number | null; // Vehicle ID assigned to this container
  complete_order: number | null;
  temperature: number;
  humidity: number;
  battery_level: number;
  created_at: string;
  updated_at: string;
  // Real-time location fields
  current_lat?: number;
  current_lng?: number;
}

export interface Order {
  id: number;
  user_id: number;
  container_id: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  price: number;
  payment_status: 'pending' | 'paid' | 'failed';
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
  // Transporter fields
  transporter_id?: number;
  vehicle_id?: number;
  assigned_at?: string;
  pickup_time?: string;
  delivery_time?: string;
  containers?: { // This represents the joined container data
    name: string;
    status: string;
    latitude?: number;
    longitude?: number;
    location?: string;
  };
}

export interface OrderWithDetails extends Order {
  container_name?: string;
  user_name?: string;
}

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
  on_time_deliveries_percent: number;
  recent_orders: Order[];
  recent_containers: Container[];
  top_locations: any[];
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
}

export interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku: string;
}

export interface DashboardStats {
  total_orders: number;
  active_containers: number;
  total_revenue: number;
  orders_by_status: Record<string, number>;
  containers_by_status: Record<string, number>;
  monthly_orders: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
  recent_orders: Array<Order>;
  recent_containers: Array<Container>;
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
