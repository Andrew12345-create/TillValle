require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_StsfT1R6ZyNi@ep-bold-silence-aiue9xsj-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Users table with admin roles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        is_superadmin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');

    // Product stock table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_stock (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        in_stock BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Product stock table created');

    // Site maintenance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_maintenance (
        id SERIAL PRIMARY KEY,
        active BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Site maintenance table created');

    // Maintenance admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Maintenance admins table created');

    // Maintenance logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id SERIAL PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Maintenance logs table created');

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Orders table created');

    // Order items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL
      )
    `);
    console.log('✅ Order items table created');

    // Insert default maintenance status
    await pool.query(`
      INSERT INTO site_maintenance (active)
      SELECT false
      WHERE NOT EXISTS (SELECT 1 FROM site_maintenance)
    `);
    console.log('✅ Default maintenance status inserted');

    // Insert sample products
    const productCount = await pool.query('SELECT COUNT(*) FROM product_stock');
    if (parseInt(productCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO product_stock (product_name, stock_quantity, in_stock) VALUES
        ('Fresh Milk', 25, true),
        ('Farm Fresh Eggs', 50, true),
        ('Apples', 30, true),
        ('Bananas', 15, true),
        ('Mangoes', 20, true),
        ('Avocados', 12, true),
        ('Kales', 18, true),
        ('Spinach', 22, true),
        ('Lettuce', 8, true),
        ('Basil', 10, true),
        ('Mint', 14, true),
        ('Free-Range Chicken', 5, true)
      `);
      console.log('✅ Sample products inserted');
    }

    // Create superadmin user
    const adminPassword = await bcrypt.hash('coder123', 10);
    await pool.query(`
      INSERT INTO users (email, password_hash, is_admin, is_superadmin)
      VALUES ($1, $2, true, true)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = $2,
        is_admin = true,
        is_superadmin = true
    `, ['admin@tillvalle.com', adminPassword]);
    console.log('✅ Superadmin user created (admin@tillvalle.com / coder123)');

    // Add to maintenance admins
    await pool.query(`
      INSERT INTO maintenance_admins (email)
      VALUES ($1)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@tillvalle.com']);
    console.log('✅ Maintenance admin added');

    console.log('\n🎉 Database initialization complete!');
    console.log('📧 Admin Email: admin@tillvalle.com');
    console.log('🔑 Admin Password: coder123');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();
