const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
  });

  try {
    await client.connect();

    // Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT
      )
    `);

    // Check site setting: if restrict_to_existing_emails is enabled, do not allow new signups
    const { isRestrictEmailsEnabled } = require('./_helpers');
    const restrictEnabled = await isRestrictEmailsEnabled(client);

    const { email, password } = JSON.parse(event.body);
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Email and password required' }),
      };
    }

    const lowerEmail = email.toLowerCase();

    // If restriction is enabled, only allow signup when the email already exists in users table
    if (restrictEnabled) {
      const existingCheck = await client.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
      if (existingCheck.rowCount === 0) {
        return {
          statusCode: 403,
          body: JSON.stringify({ ok: false, error: 'Signups are currently restricted. If you already have an account, please log in. For access, contact the site administrator.' }),
        };
      }
      // If email exists, it's okay to proceed (this branch allows re-issuing credentials but avoids creating new accounts)
    }

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
    if (existing.rowCount > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'User already exists' }),
      };
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insert = await client.query(
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
  } finally {
    await client.end();
  }
};
