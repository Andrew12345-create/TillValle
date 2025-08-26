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
  credentials: true
}));

app.use(session({
  secret: "superSecretKey", // ⚠️ change in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // secure: true only if HTTPS
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

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ ok: false, error: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insert = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, password_hash]
    );

    const newUser = insert.rows[0];
    const token = generateToken({ id: newUser.id, email });
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

  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, error: 'User not found' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid password' });

    const token = generateToken({ id: user.id, email });
    res.json({ ok: true, message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// ==========================
// Catch-all (serve frontend)
// ==========================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path));
});

// ==========================
// Start server
// ==========================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
