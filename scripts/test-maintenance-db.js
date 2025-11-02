const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testMaintenanceDB() {
  try {
    console.log('Testing maintenance database setup...');

    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Database connection successful');

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('site_maintenance', 'maintenance_logs', 'maintenance_admins')
    `);

    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables);

    if (!existingTables.includes('site_maintenance')) {
      console.log('Creating site_maintenance table...');
      await pool.query(`
        CREATE TABLE site_maintenance (
          id SERIAL PRIMARY KEY,
          active BOOLEAN DEFAULT FALSE,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ site_maintenance table created');

      // Insert initial maintenance status
      await pool.query('INSERT INTO site_maintenance (active) VALUES (FALSE)');
      console.log('✓ Initial maintenance status inserted');
    } else {
      console.log('✓ site_maintenance table already exists');
    }

    if (!existingTables.includes('maintenance_logs')) {
      console.log('Creating maintenance_logs table...');
      await pool.query(`
        CREATE TABLE maintenance_logs (
          id SERIAL PRIMARY KEY,
          action VARCHAR(20) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          admin_email VARCHAR(255) NOT NULL
        )
      `);
      console.log('✓ maintenance_logs table created');
    } else {
      console.log('✓ maintenance_logs table already exists');
    }

    if (!existingTables.includes('maintenance_admins')) {
      console.log('Creating maintenance_admins table...');
      await pool.query(`
        CREATE TABLE maintenance_admins (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL
        )
      `);
      console.log('✓ maintenance_admins table created');
    } else {
      console.log('✓ maintenance_admins table already exists');
    }

    // Insert initial admin emails
    console.log('Inserting initial admin emails...');
    await pool.query(`
      INSERT INTO maintenance_admins (email) VALUES
        ('andrewmunamwangi@gmail.com'),
        ('angelakihwaga@gmail.com')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✓ Admin emails inserted');

    // Verify data
    const adminsResult = await pool.query('SELECT email FROM maintenance_admins ORDER BY email');
    console.log('Admin emails in database:', adminsResult.rows.map(row => row.email));

    // Check maintenance status
    const maintenanceResult = await pool.query('SELECT active FROM site_maintenance LIMIT 1');
    console.log('Current maintenance status:', maintenanceResult.rows[0]?.active ? 'ACTIVE' : 'INACTIVE');

    // Test logging a sample event
    console.log('Testing maintenance log insertion...');
    await pool.query(`
      INSERT INTO maintenance_logs (action, admin_email)
      VALUES ('test_activation', 'test@example.com')
    `);
    console.log('✓ Sample log entry inserted');

    // Verify log
    const logsResult = await pool.query('SELECT * FROM maintenance_logs ORDER BY timestamp DESC LIMIT 1');
    console.log('Latest log entry:', logsResult.rows[0]);

    console.log('All tests passed! Maintenance database is ready.');

  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testMaintenanceDB();
