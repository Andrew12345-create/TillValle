const { Client } = require('pg');

async function getSiteSetting(client, key) {
  try {
    const result = await client.query('SELECT value FROM site_settings WHERE key = $1 LIMIT 1', [key]);
    if (result.rowCount === 0) return null;
    return result.rows[0].value;
  } catch (err) {
    // If table doesn't exist or any DB error, return null so callers can default safely
    console.warn('getSiteSetting warning:', err.message);
    return null;
  }
}

/**
 * Check whether the site is currently in "restrict signups to existing users" mode.
 * Returns boolean (default false).
 */
async function isRestrictEmailsEnabled(client) {
  const val = await getSiteSetting(client, 'restrict_to_existing_emails');
  if (val === null) return false;
  return String(val).toLowerCase() === 'true';
}

module.exports = { getSiteSetting, isRestrictEmailsEnabled };
