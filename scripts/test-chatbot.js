// Quick local tester for api/chatbot.js
// This script dynamically imports the Vercel serverless function and invokes
// its handler with mock req/res objects. It does NOT call external networks.

const path = require('path');

async function loadHandler() {
  const filePath = path.resolve(__dirname, '..', 'api', 'chatbot.js');
  const fileUrl = 'file://' + filePath.replace(/\\/g, '/');
  // dynamic import works from CommonJS too
  const mod = await import(fileUrl);
  return mod.default || mod.handler || mod;
}

function makeMockRes(label) {
  const out = { label, headers: {}, _status: 200, body: null };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (code) => { out._status = code; return out; };
  out.json = (obj) => { out.body = obj; console.log(`\\n[${label}] RESPONSE status=${out._status}`); console.log(JSON.stringify(obj, null, 2)); };
  out.end = () => { console.log(`[${label}] end (status=${out._status})`); };
  return out;
}

async function runOne(handler, message, label) {
  const req = { method: 'POST', headers: { 'content-type': 'application/json' }, body: { message } };
  const res = makeMockRes(label);
  try {
    await handler(req, res);
  } catch (err) {
    console.error(`[${label}] Handler threw:`, err && (err.stack || err.message || err));
  }
}

async function main() {
  console.log('Loading handler...');
  const handler = await loadHandler();
  console.log('Handler loaded. Running test cases (no GEMINI_API_KEY will exercise fallback).');

  await runOne(handler, 'hello', 'test-hello');
  await runOne(handler, 'tell me about delivery', 'test-delivery');
  await runOne(handler, 'Do you have mangoes in stock?', 'test-stock');
  await runOne(handler, '', 'test-empty');
}

main().then(() => console.log('\nDone')).catch(err => console.error('Fatal error', err));
