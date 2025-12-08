require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Neon API configuration
const NEON_API_URL = 'https://ep-billowing-mode-adkbmnzk.apirest.c-2.us-east-1.aws.neon.tech/neondb/rest/v1';
const PRODUCTS_URL = `${NEON_API_URL}/products`;

// App setup
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const BCRYPT_ROUNDS = 10;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://tillvalle.netlify.app']
    : ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3001", "http://localhost:8888"],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.set('trust proxy', 1);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "superSecretKey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Database setup
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_plFDm9xtOM3y@ep-purple-mud-adelt7ne-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

const stockPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qn6wAlZJavf3@ep-billowing-mode-adkbmnzk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

// Helper: generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// In-memory OTP store: { email: { otp: '123456', expiresAt: Date } }
const otpStore = {};

// Configure nodemailer transporter (using Gmail SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper to send OTP email
async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: '"TillValle Support" <' + process.env.EMAIL_USER + '>',
    to: email,
    subject: 'Your OTP for Password Reset',
    text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
  };
  await transporter.sendMail(mailOptions);
}

// ==========================
// AUTHENTICATION ENDPOINTS
// ==========================

// SIGNUP
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password required' });
  }

  const lowerEmail = email.toLowerCase();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ ok: false, error: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insert = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [lowerEmail, password_hash]
    );

    const newUser = insert.rows[0];
    const token = generateToken({ id: newUser.id, email: lowerEmail });
    res.json({ ok: true, message: 'Signup successful', token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password required' });
  }

  const lowerEmail = email.toLowerCase();

  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [lowerEmail]);
    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, error: 'User not found' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid password' });

    const token = generateToken({ id: user.id, email: lowerEmail });
    res.json({ ok: true, message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// LOGOUT
app.post('/logout', (req, res) => {
  try {
    console.log('Logout endpoint hit');
    if (!req.session) {
      console.log('No session found on request');
      return res.status(400).json({ ok: false, error: 'No session found' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ ok: false, error: 'Logout failed' });
      }
      res.json({ ok: true, message: 'Logout successful' });
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// DELETE ACCOUNT
app.delete('/delete-account', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ ok: false, error: 'Email and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ ok: false, error: 'Account not found' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.json({ ok: false, error: 'Invalid password' });
    }

    await pool.query('DELETE FROM users WHERE email = $1', [email]);

    req.session.destroy();
    res.json({ ok: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.json({ ok: false, error: 'Failed to delete account' });
  }
});

// ==========================
// ADMIN ENDPOINTS
// ==========================

// INIT TABLES
app.post('/api/init-tables', async (req, res) => {
  try {
    // Create products table (drop if exists to ensure correct structure)
    await stockPool.query(`DROP TABLE IF EXISTS products`);
    await stockPool.query(`
      CREATE TABLE products (
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

    // Create product_stock table if it doesn't exist
    await stockPool.query(`
      CREATE TABLE IF NOT EXISTS product_stock (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        in_stock BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create site_maintenance table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_maintenance (
        id SERIAL PRIMARY KEY,
        active BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create maintenance_admins table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create maintenance_logs table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id SERIAL PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default maintenance status if not exists
    await pool.query(`
      INSERT INTO site_maintenance (active)
      SELECT false
      WHERE NOT EXISTS (SELECT 1 FROM site_maintenance)
    `);

    console.log('✅ Database tables initialized successfully');
    res.json({ success: true, message: 'Database tables initialized successfully' });
  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize database tables' });
  }
});

// ADMIN LOGIN
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = 'admin123';

  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// ==========================
// PASSWORD RESET ENDPOINTS
// ==========================

// REQUEST OTP
app.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore[email.toLowerCase()] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false
    };

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// VERIFY OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }
  const record = otpStore[email.toLowerCase()];
  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this email' });
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[email.toLowerCase()];
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  record.verified = true;
  res.json({ message: 'OTP verified' });
});

// RESET PASSWORD
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  try {
    const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id',
      [password_hash, email.toLowerCase()]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ==========================
// STOCK MANAGEMENT ENDPOINTS
// ==========================

// GET STOCK
app.get('/stock', async (req, res) => {
  console.log('Stock endpoint hit');
  try {
    console.log('Attempting stock database query...');
    
    // Create table if it doesn't exist
    await stockPool.query(`
      CREATE TABLE IF NOT EXISTS product_stock (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        in_stock BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if table has data, if not insert sample data
    const countResult = await stockPool.query('SELECT COUNT(*) FROM product_stock');
    if (parseInt(countResult.rows[0].count) === 0) {
      await stockPool.query(`
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
    }
    
    const result = await stockPool.query('SELECT * FROM product_stock ORDER BY product_name');
    console.log('Query successful, rows:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Stock fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data', details: error.message });
  }
});

// UPDATE STOCK
app.post('/stock', async (req, res) => {
  const { product_id, stock_quantity } = req.body;
  if (!product_id || typeof stock_quantity !== 'number' || stock_quantity < 0) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  try {
    const result = await stockPool.query(
      'UPDATE product_stock SET stock_quantity = $1 WHERE product_id = $2 RETURNING *',
      [stock_quantity, product_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Stock updated', updated: result.rows[0] });
  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({ error: 'Failed to update stock', details: error.message });
  }
});

// GET PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    // Ensure products table exists with correct structure
    await stockPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id VARCHAR(50) PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 100,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await stockPool.query('SELECT * FROM products ORDER BY product_name');
    console.log(`📦 Fetched ${result.rows.length} products from database`);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET SINGLE PRODUCT
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await stockPool.query('SELECT * FROM products WHERE id = $1', [id]);

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

// CREATE NEW PRODUCT
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

    const result = await stockPool.query(
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

// UPDATE PRODUCT
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

    const result = await stockPool.query(
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

// DELETE PRODUCT
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await stockPool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

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

// ==========================
// MPESA ENDPOINTS
// ==========================

// MPESA STK PUSH
app.post('/mpesa', async (req, res) => {
  const { phone, amount, accountReference } = req.body;

  if (!phone || !amount || !accountReference) {
    return res.status(400).json({ success: false, error: 'Missing required fields: phone, amount, accountReference' });
  }

  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;

    if (!consumerKey || !consumerSecret || !passkey) {
      return res.status(500).json({
        success: false,
        error: 'Mpesa credentials not configured. Please set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_PASSKEY environment variables.'
      });
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Mpesa access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const stkPushData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: `${process.env.SITE_URL || 'http://localhost:3001'}/mpesa-callback`,
      AccountReference: accountReference,
      TransactionDesc: 'Payment for goods',
    };

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushData),
    });

    if (!stkResponse.ok) {
      const errorData = await stkResponse.text();
      throw new Error(`STK Push failed: ${errorData}`);
    }

    const stkData = await stkResponse.json();

    console.log(`Mpesa STK Push initiated to ${phone} for amount ${amount}`);
    res.json({
      success: true,
      message: 'STK Push initiated successfully',
      data: stkData,
    });

  } catch (error) {
    console.error('Mpesa STK Push error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// MPESA CALLBACK
app.post('/mpesa-callback', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('Mpesa Callback received:', JSON.stringify(callbackData, null, 2));

    if (callbackData.Body && callbackData.Body.stkCallback) {
      const stkCallback = callbackData.Body.stkCallback;

      if (stkCallback.ResultCode === 0) {
        console.log('Payment successful for CheckoutRequestID:', stkCallback.CheckoutRequestID);

        const callbackMetadata = stkCallback.CallbackMetadata;
        if (callbackMetadata && callbackMetadata.Item) {
          callbackMetadata.Item.forEach(item => {
            if (item.Name === 'Amount') {
              console.log('Amount paid:', item.Value);
            }
            if (item.Name === 'MpesaReceiptNumber') {
              console.log('Mpesa Receipt Number:', item.Value);
            }
            if (item.Name === 'TransactionDate') {
              console.log('Transaction Date:', item.Value);
            }
            if (item.Name === 'PhoneNumber') {
              console.log('Phone Number:', item.Value);
            }
          });
        }
      } else {
        console.log('Payment failed for CheckoutRequestID:', stkCallback.CheckoutRequestID);
        console.log('Result Code:', stkCallback.ResultCode);
        console.log('Result Desc:', stkCallback.ResultDesc);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mpesa callback processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================
// CHATBOT ENDPOINT
// ==========================

const responses = {
  greeting: "Hello! Welcome to TillValle! How can I help you today?",
  products: "We offer fresh fruits, vegetables, dairy, and herbs from local Kenyan farmers!",
  delivery: "Same-day delivery across Nairobi for orders before 2 PM. Delivery fees start from KES 200.",
  payment: "We accept M-Pesa and card payments.",
  order: "Visit our shop page, add items to cart, and checkout with M-Pesa or card.",
  contact: "Contact us at support@tillvalle.com or Angela at angelawanjiru@gmail.com.",
  default: "I can help with products, delivery, payments, or orders. What would you like to know?"
};

async function getStockInfo(query) {
  try {
    const isAllStockQuery = query.includes('all') || query.includes('complete') || query.includes('full');

    let stockData;
    if (isAllStockQuery) {
      const result = await stockPool.query('SELECT product_name, stock_quantity FROM product_stock ORDER BY product_name');
      stockData = result.rows.map(row => ({
        name: row.product_name,
        quantity: row.stock_quantity || 0
      }));
    } else {
      const result = await stockPool.query(
        'SELECT product_name, stock_quantity FROM product_stock WHERE LOWER(product_name) LIKE $1',
        [`%${query}%`]
      );
      stockData = result.rows.map(row => ({
        name: row.product_name,
        quantity: row.stock_quantity || 0
      }));
    }

    if (stockData.length === 0) {
      return isAllStockQuery
        ? "📦 No products found in our stock database."
        : `📦 Sorry, I couldn't find "${query}" in our stock. Try asking for "all stock" to see everything available.`;
    }

    let stockList = isAllStockQuery ? "📦 Complete Stock Information:\n\n" : "📦 Stock Information:\n\n";
    stockData.forEach(item => {
      stockList += `• ${item.name}: ${item.quantity} units\n`;
    });
    return stockList;

  } catch (error) {
    console.error('Stock query error:', error);
    return "📦 Complete Stock Information:\nI'm having trouble accessing our stock database right now. Please try again in a moment, or contact us directly for current availability.";
  }
}

async function getResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('hello') || msg.includes('hi')) return responses.greeting;
  if (msg.includes('stock') || msg.includes('inventory') || msg.includes('available')) {
    return await getStockInfo(msg);
  }
  if (msg.includes('product') || msg.includes('fruit') || msg.includes('vegetable')) return responses.products;
  if (msg.includes('deliver') || msg.includes('shipping')) return responses.delivery;
  if (msg.includes('pay') || msg.includes('payment') || msg.includes('mpesa')) return responses.payment;
  if (msg.includes('order') || msg.includes('buy')) return responses.order;
  if (msg.includes('contact') || msg.includes('support')) return responses.contact;

  return responses.default;
}

app.post('/chatbot', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    const response = await getResponse(message);
    return res.json({ message: response });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ error: 'Server error', message: 'Please try again later.' });
  }
});

// ==========================
// MAINTENANCE ENDPOINTS
// ==========================

app.get('/maintenance', async (req, res) => {
  try {
    const result = await pool.query('SELECT active FROM site_maintenance LIMIT 1');
    const isActive = result.rows.length > 0 && result.rows[0].active;
    res.json({ active: isActive });
  } catch (error) {
    console.error('Maintenance check error:', error);
    res.status(500).json({ active: false });
  }
});

app.post('/maintenance', async (req, res) => {
  const { active, adminEmail } = req.body;

  if (!adminEmail) {
    return res.status(400).json({ error: 'Admin email required' });
  }

  try {
    const adminResult = await pool.query('SELECT email FROM maintenance_admins WHERE email = $1', [adminEmail.toLowerCase()]);
    if (adminResult.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized admin email' });
    }

    await pool.query('UPDATE site_maintenance SET active = $1, last_updated = CURRENT_TIMESTAMP', [active]);

    await pool.query(
      'INSERT INTO maintenance_logs (admin_email, action, timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [adminEmail.toLowerCase(), active ? 'activated' : 'deactivated']
    );

    res.json({ success: true, active });
  } catch (error) {
    console.error('Maintenance update error:', error);
    res.status(500).json({ error: 'Failed to update maintenance mode' });
  }
});

// ==========================
// UTILITY ENDPOINTS
// ==========================

// PING
app.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

// DATABASE TEST
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, message: 'Database connected', time: result.rows[0].now });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// STOCK TEST
app.get('/stock-test', async (req, res) => {
  try {
    const result = await stockPool.query('SELECT NOW()');
    res.json({ ok: true, message: 'Stock database connected', time: result.rows[0].now });
  } catch (error) {
    console.error('Stock database test error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// TABLE STRUCTURE TEST
app.get('/table-info', async (req, res) => {
  try {
    const result = await stockPool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_stock'");
    res.json({ columns: result.rows });
  } catch (error) {
    console.error('Table info error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ==========================
// MAINTENANCE CHECK MIDDLEWARE
// ==========================

async function checkMaintenance(req, res, next) {
  try {
    const maintenanceResult = await pool.query('SELECT active FROM site_maintenance LIMIT 1');
    const isMaintenanceActive = maintenanceResult.rows.length > 0 && maintenanceResult.rows[0].active;

    if (isMaintenanceActive) {
      if (req.path === '/admin.html') {
        return next();
      }

      let userEmail = req.session?.user?.email || req.headers['x-user-email'];

      if (!userEmail) {
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            userEmail = decoded.email;
          } catch (err) {
            console.log('Invalid JWT token in maintenance check');
          }
        }
      }

      if (userEmail) {
        const adminResult = await pool.query('SELECT email FROM maintenance_admins WHERE email = $1', [userEmail.toLowerCase()]);
        const isAdmin = adminResult.rows.length > 0;

        if (isAdmin) {
          return next();
        }
      }

      res.set('X-Maintenance-Mode', 'true');
      return next();
    }

    next();
  } catch (error) {
    console.error('Maintenance check error:', error);
    next();
  }
}

// ==========================
// ADMIN ROUTES
// ==========================

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Serve admin.html directly
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// ==========================
// STATIC FILE SERVING
// ==========================

app.all('*', checkMaintenance, (req, res) => {
  if (req.method !== 'GET') {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, '..', 'public', req.path === '/' ? 'index.html' : req.path));
});

// ==========================
// START SERVER
// ==========================

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  // Open browser automatically
  const { exec } = require('child_process');
  exec(`start http://localhost:${PORT}`);
});
