require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const BCRYPT_ROUNDS = 10;

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not loaded');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection using your Neon database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        stock INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

// API Routes

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({ version: '1.0.0', name: 'TillValle' });
});

// Admin authentication endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = 'coder123';

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
    const { name, price, category, description, stock, image } = req.body;

    if (!name || !price || !category || !description || stock === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (price <= 0 || stock < 0) {
      return res.status(400).json({ error: 'Price must be positive and stock cannot be negative' });
    }

    const result = await pool.query(
      'INSERT INTO products (name, price, category, description, stock, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, price, category, description, stock, image || null]
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
    const { name, price, category, description, stock, image } = req.body;

    if (!name || !price || !category || !description || stock === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (price <= 0 || stock < 0) {
      return res.status(400).json({ error: 'Price must be positive and stock cannot be negative' });
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, category = $3, description = $4, stock = $5, image = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, price, category, description, stock, image || null, id]
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
    console.log(`🔑 Admin password: coder123`);
  });
}

startServer();
