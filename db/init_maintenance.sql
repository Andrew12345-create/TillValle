-- Create site_maintenance table to store current maintenance status
CREATE TABLE IF NOT EXISTS site_maintenance (
    id SERIAL PRIMARY KEY,
    active BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial maintenance status (inactive)
INSERT INTO site_maintenance (active) VALUES (FALSE)
ON CONFLICT DO NOTHING;

-- Create maintenance_logs table to log shutdown/activation events
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(20) NOT NULL,  -- e.g., 'activate' or 'deactivate'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_email VARCHAR(255) NOT NULL
);

-- Create maintenance_admins table to store allowed admin emails
CREATE TABLE IF NOT EXISTS maintenance_admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- Insert initial admin emails
INSERT INTO maintenance_admins (email) VALUES
    ('andrewmunamwangi@gmail.com'),
    ('angelakihwaga@gmail.com')
ON CONFLICT (email) DO NOTHING;  -- Avoid duplicates if already exists
