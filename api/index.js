require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const fetch = require('node-fetch');

// App setup
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const BCRYPT_ROUNDS = 10;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.set('trust proxy', 1); // trust first proxy if behind one

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(session({
  secret: "superSecretKey", // ⚠️ change in production
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // set to true if using HTTPS
    httpOnly: true,
    sameSite: 'lax'
  }
}));

const apiKey = 'napi_aa19lsyo2ekw2lgwkph6nor6vepupxx24kq0jkt0y79lfqd9zyu608n7nh7x6te9';

// Database setup
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
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

// ==========================
// SIGNUP
// ==========================
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

// ==========================
// LOGIN
// ==========================
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

// ==========================
// LOGOUT
// ==========================
app.post('/logout', (req, res) => {
  try {
    console.log('Logout endpoint hit');
    if (!req.session) {
      console.log('No session found on request');
      return res.status(400).json({ ok: false, error: 'No session found' });
    }
    // Destroy the session if using session-based auth
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

// ==========================
// PING
// ==========================
app.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

// ==========================
// MPESA
// ==========================
app.post('/mpesa', async (req, res) => {
  const { phone, amount, accountReference } = req.body;

  // Validate required fields
  if (!phone || !amount || !accountReference) {
    return res.status(400).json({ success: false, error: 'Missing required fields: phone, amount, accountReference' });
  }

  try {
    // Mpesa STK Push API credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE || '174379'; // Default sandbox shortcode
    const passkey = process.env.MPESA_PASSKEY;

    if (!consumerKey || !consumerSecret || !passkey) {
      return res.status(500).json({
        success: false,
        error: 'Mpesa credentials not configured. Please set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_PASSKEY environment variables.'
      });
    }

    // Get access token
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

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // Prepare STK push request
    const stkPushData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: `${process.env.URL || 'http://localhost:3001'}/mpesa-callback`,
      AccountReference: accountReference,
      TransactionDesc: 'Payment for goods',
    };

    // Make STK push request
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

// ==========================
// MPESA CALLBACK
// ==========================
app.post('/mpesa-callback', async (req, res) => {
  try {
    const callbackData = req.body;

    // Log the callback data for debugging
    console.log('Mpesa Callback received:', JSON.stringify(callbackData, null, 2));

    // Process the callback data
    if (callbackData.Body && callbackData.Body.stkCallback) {
      const stkCallback = callbackData.Body.stkCallback;

      // Check the result code
      if (stkCallback.ResultCode === 0) {
        // Payment successful
        console.log('Payment successful for CheckoutRequestID:', stkCallback.CheckoutRequestID);

        // Here you would typically:
        // 1. Update the order status in your database
        // 2. Send confirmation email to customer
        // 3. Update inventory
        // 4. Send notifications

        // For now, just log success
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
        // Payment failed
        console.log('Payment failed for CheckoutRequestID:', stkCallback.CheckoutRequestID);
        console.log('Result Code:', stkCallback.ResultCode);
        console.log('Result Desc:', stkCallback.ResultDesc);
      }
    }

    // Always return success to acknowledge receipt of callback
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
// STOCK MANAGEMENT
// ==========================
app.get('/stock', async (req, res) => {
  try {
    const result = await pool.query('SELECT product_id, product_name, in_stock FROM product_stock ORDER BY product_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Stock fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.post('/stock', async (req, res) => {
  const { product_id, in_stock } = req.body;
  if (!product_id || typeof in_stock !== 'boolean') {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  try {
    const result = await pool.query(
      'UPDATE product_stock SET in_stock = $1, last_updated = CURRENT_TIMESTAMP WHERE product_id = $2 RETURNING *',
      [in_stock, product_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Stock updated', updated: result.rows[0] });
  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// ==========================
// CHATBOT
// ==========================
app.post('/chatbot', async (req, res) => {
  const { message, isAdmin } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Simple responses for local testing
  const lowerMessage = message.toLowerCase();
  let response = 'I\'m here to help with your questions about TillValle!';

  if (lowerMessage.includes('stock') || lowerMessage.includes('in stock') || lowerMessage.includes('available')) {
    if (isAdmin) {
      try {
        const result = await pool.query('SELECT product_id, product_name, in_stock FROM product_stock ORDER BY product_name');
        const stockData = result.rows;
        const inStockItems = stockData.filter(item => item.in_stock).map(item => item.product_name);
        const outOfStockItems = stockData.filter(item => !item.in_stock).map(item => item.product_name);
        response = 'Current stock status:\n';
        if (inStockItems.length > 0) {
          response += `In stock: ${inStockItems.join(', ')}\n`;
        }
        if (outOfStockItems.length > 0) {
          response += `Out of stock: ${outOfStockItems.join(', ')}`;
        }
      } catch (error) {
        response = 'Sorry, I couldn\'t fetch the stock information right now.';
      }
    } else {
      response = 'For current stock information, please visit our shop page or contact support. As a regular user, detailed stock checks are limited.';
    }
  }

  res.json({ message: response });
});

// ==========================
// Catch-all (serve frontend)
// ==========================
app.all('*', (req, res) => {
  if (req.method !== 'GET') {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, '..', 'public', req.path === '/' ? 'index.html' : req.path));
});

// ==========================
// Start server
// ==========================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
