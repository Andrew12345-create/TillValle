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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tillvalle.netlify.app']
    : ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3001", "http://localhost:8888"],
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
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const stockPool = new Pool({
  connectionString: process.env.STOCK_DB_URL,
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
// DATABASE TEST
// ==========================
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, message: 'Database connected', time: result.rows[0].now });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ==========================
// STOCK TEST
// ==========================
app.get('/stock-test', async (req, res) => {
  try {
    const result = await stockPool.query('SELECT NOW()');
    res.json({ ok: true, message: 'Stock database connected', time: result.rows[0].now });
  } catch (error) {
    console.error('Stock database test error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ==========================
// TABLE STRUCTURE TEST
// ==========================
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
      CallBackURL: `${process.env.SITE_URL || 'http://localhost:3001'}/mpesa-callback`,
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
  console.log('Stock endpoint hit');
  try {
    console.log('Attempting stock database query...');
    const result = await stockPool.query('SELECT * FROM product_stock ORDER BY product_name');
    console.log('Query successful, rows:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Stock fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data', details: error.message });
  }
});

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

// ==========================
// OTP and Password Reset
// ==========================

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// In-memory OTP store: { email: { otp: '123456', expiresAt: Date } }
const otpStore = {};

// Configure nodemailer transporter (using Gmail SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
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

// POST /request-otp
app.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP with expiry 10 minutes
    otpStore[email.toLowerCase()] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false
    };

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /verify-otp
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
  // OTP verified, mark as verified
  record.verified = true;
  res.json({ message: 'OTP verified' });
});

// POST /reset-password
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  try {
    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password in DB
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
// CHATBOT
// ==========================
app.post('/chatbot', async (req, res) => {
  const { message, isAdmin } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const lowerMessage = message.toLowerCase();
  let response = "I'm here to help with your questions about TillValle!";

  // Check if user typed just a product name
  const products = ['milk', 'eggs', 'butter', 'apples', 'mangoes', 'kales', 'spinach', 'basil', 'mint', 'bananas', 'avocados', 'chicken', 'ghee', 'coriander', 'parsley', 'lettuce', 'managu', 'terere', 'salgaa'];
  const exactProduct = products.find(product => lowerMessage.trim() === product);
  
  if (exactProduct) {
    try {
      const result = await stockPool.query('SELECT * FROM product_stock WHERE LOWER(product_name) LIKE $1', [`%${exactProduct}%`]);
      
      if (result.rows.length > 0) {
        const item = result.rows[0];
        response = item.stock_quantity > 0 
          ? `✅ ${item.product_name}: ${item.stock_quantity} available in stock!`
          : `❌ ${item.product_name} is currently out of stock. We'll restock soon!`;
      } else {
        response = `I couldn't find ${exactProduct} in our inventory. Please check our shop page for available items.`;
      }
    } catch (error) {
      console.error('Stock query error:', error);
      response = `Let me check ${exactProduct} for you... Please visit our shop page to see current availability.`;
    }
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    response = "Hello! Welcome to TillValle! How can I help you with fresh produce delivery today?";
  } else if (lowerMessage.includes('stock') || lowerMessage.includes('in stock') || lowerMessage.includes('available')) {
    try {
      // Check for specific item queries
      const products = ['milk', 'eggs', 'butter', 'apples', 'mangoes', 'kales', 'spinach', 'basil', 'mint', 'bananas', 'avocados', 'chicken', 'ghee', 'coriander', 'parsley', 'lettuce', 'managu', 'terere', 'salgaa'];
      const mentionedProduct = products.find(product => lowerMessage.includes(product));
      
      if (mentionedProduct) {
        // Query for specific item
        const result = await stockPool.query('SELECT * FROM product_stock WHERE LOWER(product_name) LIKE $1', [`%${mentionedProduct}%`]);
        
        if (result.rows.length > 0) {
          const item = result.rows[0];
          response = item.stock_quantity > 0 
            ? `✅ ${item.product_name}: ${item.stock_quantity} available in stock!`
            : `❌ ${item.product_name} is currently out of stock. We'll restock soon!`;
        } else {
          response = `I couldn't find ${mentionedProduct} in our inventory. Please check our shop page for available items.`;
        }
      } else {
        // General stock query - show all items
        const result = await stockPool.query('SELECT * FROM product_stock ORDER BY product_name');
        const inStockItems = result.rows.filter(item => item.stock_quantity > 0);
        const outOfStockItems = result.rows.filter(item => item.stock_quantity <= 0);
        
        response = 'Current stock levels:\n\n';
        
        if (inStockItems.length > 0) {
          response += '✅ In Stock:\n';
          inStockItems.forEach(item => {
            response += `• ${item.product_name}: ${item.stock_quantity} available\n`;
          });
          response += '\n';
        }
        
        if (outOfStockItems.length > 0) {
          response += '❌ Out of Stock:\n';
          outOfStockItems.forEach(item => {
            response += `• ${item.product_name}\n`;
          });
        }
      }
    } catch (error) {
      console.error('Stock query error:', error);
      response = "We have fresh produce available! Visit our shop page to see current stock levels.";
    }
  }

  res.json({ message: response });
});

// ==========================
// Start server
// ==========================
// ==========================
// Catch-all (serve frontend) - MUST BE LAST
// ==========================
app.all('*', (req, res) => {
  if (req.method !== 'GET') {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, '..', 'public', req.path === '/' ? 'index.html' : req.path));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
