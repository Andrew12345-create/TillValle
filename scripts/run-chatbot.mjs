import chatbot from './chatbot.mjs';

function makeMockRes(label) {
  const out = { label, headers: {}, _status: 200, body: null };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (code) => { out._status = code; return out; };
  out.json = (obj) => { out.body = obj; console.log(`\n[${label}] RESPONSE status=${out._status}`); console.log(JSON.stringify(obj, null, 2)); };
  out.end = () => { console.log(`[${label}] end (status=${out._status})`); };
  return out;
}

async function runOne(message, label) {
  const req = { method: 'POST', headers: { 'content-type': 'application/json' }, body: { message } };
  const res = makeMockRes(label);
  try {
    await chatbot(req, res);
  } catch (err) {
    console.error(`[${label}] Handler threw:`, err && (err.stack || err.message || err));
  }
}

async function main() {
  console.log('Running ESM test runner (no GEMINI_API_KEY => fallback expected)');
  await runOne('hello', 'test-hello');
  await runOne('what is your delivery policy', 'test-delivery');
  await runOne('do you have mangoes', 'test-stock');
  await runOne('', 'test-empty');
}

main().then(() => console.log('\nDone')).catch(err => console.error('Fatal', err));
