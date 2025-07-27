export interface Database {
  public: {
    Tables: {
      containers: {
        Row: {
          id: string;
          name: string;
          location: string;
          status: 'active' | 'inactive' | 'warning';
          temperature: number;
          humidity: number;
          battery_level: number;
          assigned_to: string | null;
          vehicle_id: number | null;
          created_at: string;
          last_updated: string;
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
      };
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
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
