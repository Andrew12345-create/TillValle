require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

// App setup
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const BCRYPT_ROUNDS = 10;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000"],
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
