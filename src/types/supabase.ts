export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          company: string | null;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          role?: string | null;
          created_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: number;
          transporter_id: string;
          plate_number: string;
          model: string;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          transporter_id: string;
          plate_number: string;
          model: string;
          capacity: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          transporter_id?: string;
          plate_number?: string;
          model?: string;
          capacity?: number;
          created_at?: string;
        };
      };
      containers: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          current_lat: number | null;
          current_lng: number | null;
          status: 'active' | 'inactive' | 'warning';
          temperature: number;
          humidity: number;
          battery_level: number;
          user_id: string | null;
          vehicle_id: number | null;
          complete_order: number | null;
          created_at: string;
          updated_at: string;
          last_updated: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          current_lat?: number | null;
          current_lng?: number | null;
          status?: 'active' | 'inactive' | 'warning';
          temperature?: number;
          humidity?: number;
          battery_level?: number;
          user_id?: string | null;
          vehicle_id?: number | null;
          complete_order?: number | null;
          created_at?: string;
          updated_at?: string;
          last_updated?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          current_lat?: number | null;
          current_lng?: number | null;
          status?: 'active' | 'inactive' | 'warning';
          temperature?: number;
          humidity?: number;
          battery_level?: number;
          user_id?: string | null;
          vehicle_id?: number | null;
          complete_order?: number | null;
          created_at?: string;
          updated_at?: string;
          last_updated?: string;
        };
      };
      orders: {
        Row: {
          id: number;
          user_id: string;
          container_id: string;
          vehicle_id: number | null;
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
          price: number;
          payment_status: 'pending' | 'paid' | 'failed';
          pickup_address: string;
          pickup_lat: number;
          pickup_lng: number;
          drop_address: string;
          drop_lat: number;
          drop_lng: number;
          route_geometry: any | null;
          current_lat: number | null;
          current_lng: number | null;
          buyer_phone: string | null;
          notes: string | null;
          transporter_id: string | null;
          assigned_at: string | null;
          pickup_time: string | null;
          delivery_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          container_id: string;
          vehicle_id?: number | null;
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
          price: number;
          payment_status?: 'pending' | 'paid' | 'failed';
          pickup_address: string;
          pickup_lat: number;
          pickup_lng: number;
          drop_address: string;
          drop_lat: number;
          drop_lng: number;
          route_geometry?: any | null;
          current_lat?: number | null;
          current_lng?: number | null;
          buyer_phone?: string | null;
          notes?: string | null;
          transporter_id?: string | null;
          assigned_at?: string | null;
          pickup_time?: string | null;
          delivery_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          container_id?: string;
          vehicle_id?: number | null;
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
          price?: number;
          payment_status?: 'pending' | 'paid' | 'failed';
          pickup_address?: string;
          pickup_lat?: number;
          pickup_lng?: number;
          drop_address?: string;
          drop_lat?: number;
          drop_lng?: number;
          route_geometry?: any | null;
          current_lat?: number | null;
          current_lng?: number | null;
          buyer_phone?: string | null;
          notes?: string | null;
          transporter_id?: string | null;
          assigned_at?: string | null;
          pickup_time?: string | null;
          delivery_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          type: string;
          message: string;
          link: string;
          entity_id: string;
          entity_type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          message: string;
          link: string;
          entity_id: string;
          entity_type: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          message?: string;
          link?: string;
          entity_id?: string;
          entity_type?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
