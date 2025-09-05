const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const BCRYPT_ROUNDS = 10;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { email, password } = JSON.parse(event.body);
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Email and password required' }),
      };
    }

    const lowerEmail = email.toLowerCase();

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
    if (existing.rowCount > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'User already exists' }),
      };
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insert = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [lowerEmail, password_hash]
    );

    const newUser = insert.rows[0];
    const token = generateToken({ id: newUser.id, email: lowerEmail });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Signup successful', token }),
    };
  } catch (err) {
    console.error('Signup error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Server error' }),
    };
  }
};
