/**
 * End-to-end smoke test of the inventory flow against a RUNNING API.
 *   npm run dev          (in another terminal)
 *   npm run smoke        (API_URL defaults to http://localhost:5000/api)
 *
 * Creates its own user, warehouse and product with random codes, so it can be run
 * repeatedly. It leaves that test data in the database.
 */
const API = process.env.API_URL || 'http://localhost:5000/api';
const tag = Math.random().toString(36).slice(2, 7).toUpperCase();
let token;
let failures = 0;

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, ...json };
}

async function ok(method, path, body) {
  const res = await call(method, path, body);
  if (!res.success) throw new Error(`${method} ${path} -> ${res.status}: ${res.message}`);
  return res.data;
}

function check(label, actual, expected) {
  const pass = actual === expected;
  if (!pass) failures += 1;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
}

async function stockOf(productId) {
  const p = await ok('GET', `/products/${productId}`);
  const at = (locId) => p.stockByLocation.find((s) => s.location._id === locId)?.quantity ?? 0;
  return { total: p.onHand, at };
}

async function run() {
  const auth = await ok('POST', '/auth/signup', {
    loginId: `qa${tag}`.toLowerCase(),
    email: `qa${tag}@example.com`.toLowerCase(),
    password: 'Smoke@12345',
  });
  token = auth.token;

  const wh = await ok('POST', '/warehouses', { name: `Smoke ${tag}`, code: `S${tag}` });
  const main = wh.locations.find((l) => l.isDefault)._id;
  const rack = (await ok('POST', '/locations', { name: 'Production Rack', code: 'PROD', warehouse: wh._id }))._id;
  const product = await ok('POST', '/products', { name: 'Steel Rod', sku: `STEEL-${tag}`, uom: 'kg', initialStock: { quantity: 0 } });

  // Scenario 1: receipt of 100
  const receipt = await ok('POST', '/receipts', { contact: 'Vendor', destLocation: main, lines: [{ product: product._id, quantity: 100 }] });
  check('receipt reference format', /^S\w+\/IN\/\d{4}$/.test(receipt.reference), true);
  check('receipt confirm -> ready', (await ok('POST', `/receipts/${receipt._id}/confirm`)).status, 'ready');
  check('receipt validate -> done', (await ok('POST', `/receipts/${receipt._id}/validate`)).status, 'done');
  check('stock after receipt', (await stockOf(product._id)).total, 100);
  check('double validate rejected', (await call('POST', `/receipts/${receipt._id}/validate`)).status, 400);

  // Scenario 2: transfer 20 main -> rack
  const transfer = await ok('POST', '/transfers', { sourceLocation: main, destLocation: rack, lines: [{ product: product._id, quantity: 20 }] });
  await ok('POST', `/transfers/${transfer._id}/validate`);
  let s = await stockOf(product._id);
  check('main after transfer', s.at(main), 80);
  check('rack after transfer', s.at(rack), 20);
  check('total after transfer', s.total, 100);

  // Scenario 3: deliver 20 (from the rack)
  const delivery = await ok('POST', '/deliveries', { contact: 'Customer', sourceLocation: rack, lines: [{ product: product._id, quantity: 20 }] });
  check('delivery confirm -> ready', (await ok('POST', `/deliveries/${delivery._id}/confirm`)).status, 'ready');
  await ok('POST', `/deliveries/${delivery._id}/validate`);
  check('total after delivery', (await stockOf(product._id)).total, 80);

  // Scenario 4: count 77 at main (80 recorded)
  const adj = await ok('POST', '/adjustments', { location: main, reason: 'Damaged', lines: [{ product: product._id, countedQuantity: 77 }] });
  const done = await ok('POST', `/adjustments/${adj._id}/validate`);
  check('adjustment difference', done.lines[0].difference, -3);
  check('total after adjustment', (await stockOf(product._id)).total, 77);

  // Guard rails
  const tooMuch = await ok('POST', '/deliveries', { sourceLocation: main, lines: [{ product: product._id, quantity: 1000 }] });
  check('over-stock delivery confirm -> waiting', (await ok('POST', `/deliveries/${tooMuch._id}/confirm`)).status, 'waiting');
  check('over-stock delivery validate rejected', (await call('POST', `/deliveries/${tooMuch._id}/validate`)).status, 400);
  check('stock unchanged after rejection', (await stockOf(product._id)).total, 77);
  check('same source/destination rejected', (await call('POST', '/transfers', { sourceLocation: main, destLocation: main, lines: [] })).status, 400);
  check('negative quantity rejected', (await call('POST', '/receipts', { destLocation: main, lines: [{ product: product._id, quantity: -5 }] })).status, 400);

  // Ledger + dashboard
  const ledger = await ok('GET', `/ledger?product=${product._id}`);
  check('ledger entries', ledger.total, 4);
  const summary = await ok('GET', `/dashboard/summary?warehouse=${wh._id}`);
  check('dashboard pending deliveries', summary.deliveries.pending, 1);
  check('unauthenticated request rejected', (token = null, (await call('GET', '/products')).status), 401);
}

run()
  .catch((err) => {
    failures += 1;
    console.error('ERROR', err.message);
  })
  .finally(() => {
    console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
    process.exitCode = failures ? 1 : 0;
  });
