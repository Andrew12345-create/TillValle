// ESM copy of api/chatbot.js for local testing as an ES module

function extractTextFromResponse(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.text === 'string') return data.text;
  if (data.output && Array.isArray(data.output) && data.output[0]) {
    const c = data.output[0].content;
    if (Array.isArray(c) && c[0] && typeof c[0].text === 'string') return c[0].text;
    if (typeof c === 'string') return c;
  }
  if (data.candidates && Array.isArray(data.candidates) && data.candidates[0] && data.candidates[0].output) {
    return data.candidates[0].output;
  }
  if (data.message && typeof data.message === 'string') return data.message;
  if (data.outputText && typeof data.outputText === 'string') return data.outputText;
  return null;
}

const quickResponses = {
  greeting: "Hello! Welcome to TillValle! How can I help you today?",
  products: "We offer fresh fruits, vegetables, dairy, and herbs from local Kenyan farmers!",
  delivery: "Same-day delivery across Nairobi for orders before 2 PM. Delivery fees start from KES 200.",
  payment: "We accept M-Pesa and card payments.",
  order: "Visit our shop page, add items to cart, and checkout with M-Pesa or card.",
  contact: "Contact us at support@tillvalle.com or Angela at angelawanjiru@gmail.com.",
  default: "I can help with products, delivery, payments, or orders. What would you like to know?"
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = {};
  try { body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}'); } catch (e) { body = {}; }
  const message = (body.message || '').toString().trim();
  if (!message) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(400).json({ error: 'Message required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      // dynamic import to avoid ESM/CJS mismatch at runtime
      const mod = await import('@google/genai');
      const GoogleGenAI = mod.GoogleGenAI || mod.default?.GoogleGenAI || mod.default || mod.GoogleGenAI;
      if (!GoogleGenAI) throw new Error('GenAI SDK not found');

      const client = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const resp = await client.models.generateContent({ model, contents: message });
      const text = extractTextFromResponse(resp) || extractTextFromResponse(resp?.output) || extractTextFromResponse(resp?.candidates?.[0]);
      if (text) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ message: text });
      }
      // otherwise fall through to fallback response
    } catch (err) {
      // Log server-side; do not expose internal error details to clients
      console.error('Gemini call failed:', err && (err.stack || err.message || err));
    }
  }

  // Fallback rule-based handling
  const msg = message.toLowerCase();
  if (msg.includes('stock') || msg.includes('inventory') || msg.includes('available')) {
    // Let the client call your stock function or return a helpful fallback
    return res.status(200).json({ message: "📦 Ask for specific products or 'stock info' to see available items." });
  }
  if (msg.includes('hello') || msg.includes('hi')) return res.status(200).json({ message: quickResponses.greeting });
  if (msg.includes('product') || msg.includes('fruit') || msg.includes('vegetable')) return res.status(200).json({ message: quickResponses.products });
  if (msg.includes('deliver') || msg.includes('shipping')) return res.status(200).json({ message: quickResponses.delivery });
  if (msg.includes('pay') || msg.includes('payment') || msg.includes('mpesa')) return res.status(200).json({ message: quickResponses.payment });
  if (msg.includes('order') || msg.includes('buy')) return res.status(200).json({ message: quickResponses.order });
  if (msg.includes('contact') || msg.includes('support')) return res.status(200).json({ message: quickResponses.contact });

  return res.status(200).json({ message: quickResponses.default });
}
