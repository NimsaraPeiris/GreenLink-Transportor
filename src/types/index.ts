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
  location?: string; // Old field, mark as optional or remove if fully migrated
  latitude?: number;  // New field
  longitude?: number; // New field
  status: 'active' | 'inactive' | 'warning';
  last_updated: string;
  assigned_to: number;
  temperature: number;
  humidity: number;
  battery_level: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  container_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  price: number;
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
  notes?: string; // Added for additional details
  containers?: { // This represents the joined container data
    name: string;
    status: string;
    latitude?: number;
    longitude?: number;
    location?: string; // Keep if the DB still has it and you need it for other things
  };
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
