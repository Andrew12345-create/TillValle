#!/usr/bin/env node
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mod = await import(pathToFileURL(path.join(__dirname, './chatbot_copy.mjs')).href);
const handler = mod.default || mod.handler || mod;

function makeRes() {
  let headers = {};
  let statusCode = 200;
  return {
    setHeader: (k, v) => { headers[k] = v; },
    status(code) { statusCode = code; return this; },
    json(obj) { console.log('== RESPONSE STATUS', statusCode); console.log(JSON.stringify(obj, null, 2)); return Promise.resolve(); },
    end() { console.log('== END', statusCode); return Promise.resolve(); }
  };
}

async function runTest(message) {
  const req = { method: 'POST', body: JSON.stringify({ message }) };
  const res = makeRes();
  await handler(req, res);
}

console.log('Running fallback tests (no GEMINI_API_KEY)');
  console.log('Running tests (GEMINI path will be used if GEMINI_API_KEY is set)');
await runTest('hello');
await runTest('Do you have milk?');
await runTest('How do I pay?');

console.log('\nIf you want to test the Gemini path, set GEMINI_API_KEY in your environment and run this script again.');
