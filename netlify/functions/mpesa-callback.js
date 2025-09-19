exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const callbackData = JSON.parse(event.body);

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
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('Mpesa callback processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
