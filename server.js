const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection using your Neon database
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qn6wAlZJavf3@ep-billowing-mode-adkbmnzk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL database successfully');
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
}

// Initialize database table
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if we have any products, if not, insert sample data
    const result = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(result.rows[0].count) === 0) {
      const sampleProducts = [
        ['Organic Tomatoes', 150.00, 'Vegetables', 'Fresh organic tomatoes grown without pesticides', 50],
        ['Fresh Spinach', 80.00, 'Leafy Greens', 'Nutrient-rich spinach leaves', 30],
        ['Organic Carrots', 120.00, 'Root Vegetables', 'Sweet and crunchy organic carrots', 40],
        ['Fresh Herbs Mix', 100.00, 'Herbs', 'Mixed fresh herbs including basil, cilantro, and parsley', 25],
        ['Organic Lettuce', 90.00, 'Leafy Greens', 'Crisp organic lettuce heads', 35],
        ['Cherry Tomatoes', 200.00, 'Vegetables', 'Sweet cherry tomatoes perfect for salads', 60],
        ['Kale', 110.00, 'Leafy Greens', 'Superfood kale packed with nutrients', 20],
        ['Bell Peppers', 180.00, 'Vegetables', 'Colorful bell peppers - red, yellow, green', 45]
      ];

      for (const product of sampleProducts) {
        await pool.query(
          'INSERT INTO products (name, price, category, description, stock) VALUES ($1, $2, $3, $4, $5)',
          product
        );
      }
      console.log('✅ Sample products inserted into database');
    }
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

// API Routes

// Admin authentication endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = 'tillevalle2024'; // Change this to a secure password

  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    console.log(`📦 Fetched ${result.rows.length} products from database`);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`📦 Fetched product: ${result.rows[0].name}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, category, description, stock } = req.body;

    // Validation
    if (!name || !price || !category || !description || stock === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (price <= 0 || stock < 0) {
      return res.status(400).json({ error: 'Price must be positive and stock cannot be negative' });
    }

    const result = await pool.query(
      'INSERT INTO products (name, price, category, description, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, price, category, description, stock]
    );

    console.log(`✅ Created new product: ${result.rows[0].name}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, stock } = req.body;

    // Validation
    if (!name || !price || !category || !description || stock === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (price <= 0 || stock < 0) {
      return res.status(400).json({ error: 'Price must be positive and stock cannot be negative' });
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, category = $3, description = $4, stock = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, price, category, description, stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`✅ Updated product: ${result.rows[0].name}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`🗑️ Deleted product: ${result.rows[0].name}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h1>🌱 TilleValle Farm API</h1>
    <p>Welcome to TilleValle Farm management system!</p>
    <ul>
      <li><a href="/admin">Admin Panel</a></li>
      <li><a href="/api/products">View Products API</a></li>
    </ul>
  `);
});

// Initialize database and start server
async function startServer() {
  await testConnection();
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🔗 Admin panel: http://localhost:${port}/admin`);
    console.log(`🔗 API endpoint: http://localhost:${port}/api/products`);
    console.log(`🔑 Admin password: tillevalle2024`);
  });
}

startServer();
