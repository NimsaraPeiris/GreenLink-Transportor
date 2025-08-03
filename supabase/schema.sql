-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    company VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    transporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    capacity DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Containers table
CREATE TABLE IF NOT EXISTS containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255), -- Legacy location field
    latitude DECIMAL(10,8), -- Static latitude
    longitude DECIMAL(11,8), -- Static longitude
    current_lat DECIMAL(10,8), -- Real-time latitude
    current_lng DECIMAL(11,8), -- Real-time longitude
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'warning')),
    temperature DECIMAL(5,2) DEFAULT 0,
    humidity DECIMAL(5,2) DEFAULT 0,
    battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Using assigned_to as per SQL samples
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    complete_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled')),
    price DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    pickup_address TEXT NOT NULL,
    pickup_lat DECIMAL(10,8) NOT NULL,
    pickup_lng DECIMAL(11,8) NOT NULL,
    drop_address TEXT NOT NULL,
    drop_lat DECIMAL(10,8) NOT NULL,
    drop_lng DECIMAL(11,8) NOT NULL,
    route_geometry JSONB,
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    buyer_phone VARCHAR(20),
    notes TEXT,
    transporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    link TEXT NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON containers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle order status changes and container assignment
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When order status changes to 'confirmed'
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE containers
        SET
            assigned_to = NEW.transporter_id,
            vehicle_id = NEW.vehicle_id,
            status = 'active',
            last_updated = NOW()
        WHERE id = NEW.container_id;
        
        -- Create notification
        INSERT INTO notifications (type, message, link, entity_id, entity_type)
        VALUES (
            'order_confirmed',
            'Order #' || NEW.id || ' has been confirmed and container assigned',
            '/orders/' || NEW.id,
            NEW.id::text,
            'order'
        );
    END IF;
    
    -- When order status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE containers
        SET
            assigned_to = NULL,
            vehicle_id = NULL,
            status = 'inactive',
            complete_order = NEW.id,
            last_updated = NOW()
        WHERE id = NEW.container_id;
        
        -- Create notification
        INSERT INTO notifications (type, message, link, entity_id, entity_type)
        VALUES (
            'order_completed',
            'Order #' || NEW.id || ' has been completed and container unassigned',
            '/orders/' || NEW.id,
            NEW.id::text,
            'order'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for order status changes
CREATE TRIGGER order_status_change_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_status_change();

-- Function to handle real-time location updates
CREATE OR REPLACE FUNCTION update_container_location(
    container_id UUID,
    new_lat DECIMAL(10,8),
    new_lng DECIMAL(11,8)
)
RETURNS VOID AS $$
BEGIN
    UPDATE containers 
    SET 
        current_lat = new_lat,
        current_lng = new_lng,
        last_updated = NOW()
    WHERE id = container_id;
END;
$$ language 'plpgsql';

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic examples - adjust based on your auth requirements)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view containers" ON containers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update containers they're assigned to" ON containers FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Users can view orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Transporters can manage their vehicles" ON vehicles FOR ALL USING (transporter_id = auth.uid());

CREATE POLICY "Users can view notifications" ON notifications FOR SELECT TO authenticated USING (true);