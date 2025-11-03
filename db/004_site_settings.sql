-- Create a simple key/value site_settings table for small global flags
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Insert default: when true, new signups are blocked and only existing user emails are allowed.
INSERT INTO site_settings (key, value) VALUES ('restrict_to_existing_emails', 'false')
ON CONFLICT (key) DO NOTHING;
