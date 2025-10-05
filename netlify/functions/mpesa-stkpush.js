const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { phone, amount, accountReference } = JSON.parse(event.body);

    // Validate required fields
    if (!phone || !amount || !accountReference) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: phone, amount, accountReference' }),
      };
    }

    // Mpesa STK Push API credentials (these should be in environment variables)
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE || '174379'; // Default sandbox shortcode
    const passkey = process.env.MPESA_PASSKEY;

    if (!consumerKey || !consumerSecret || !passkey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Mpesa credentials not configured' }),
      };
    }

    // Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    // Use sandbox or production URLs based on environment variable
    const isProduction = process.env.MPESA_ENV === 'production';

    const oauthUrl = isProduction
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const stkPushUrl = isProduction
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const tokenResponse = await fetch(oauthUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get access token:', tokenResponse.status, errorText);
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate timestamp and password
    // Correct timestamp format: YYYYMMDDHHMMSS
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const timestamp = 
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());
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
      CallBackURL: `${process.env.URL}/.netlify/functions/mpesa-callback`,
      AccountReference: accountReference,
      TransactionDesc: 'Payment for goods',
    };

    // Make STK push request
    const stkResponse = await fetch(stkPushUrl, {
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

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        message: 'STK Push initiated successfully',
        data: stkData,
      }),
    };

  } catch (error) {
    console.error('Mpesa STK Push error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
