import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
const connection = process.env.DATABASE_URL;
if (
  !connection ||
  !['localhost', '127.0.0.1'].includes(new URL(connection).hostname)
)
  throw new Error('Use the isolated local PostgreSQL database only.');
const key =
  process.env.DATA_ENCRYPTION_KEY ||
  (await readFile('.data/encryption.key')).toString('hex');
const probe = createServer();
await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const child = spawn(
  process.execPath,
  [
    'node_modules/next/dist/bin/next',
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    String(port),
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: connection,
      DATA_ENCRYPTION_KEY: key,
      APP_ORIGIN: origin,
      AI_GATEWAY_URL: '',
      AI_GATEWAY_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let output = '';
child.stdout.on('data', (chunk) => {
  output = (output + chunk).slice(-5000);
});
child.stderr.on('data', (chunk) => {
  output = (output + chunk).slice(-5000);
});
const request = (path, method = 'GET', body, cookie = '') =>
  fetch(origin + path, {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const cookies = (response) =>
  response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, output);
  const login = await request('/api/auth', 'POST', {
    action: 'demo',
    role: 'OWNER',
  });
  assert.equal(login.status, 200, await login.clone().text());
  assert.match(login.headers.get('set-cookie') || '', /HttpOnly/);
  assert.match(login.headers.get('set-cookie') || '', /Secure/);
  assert.match(login.headers.get('set-cookie') || '', /SameSite=strict/);
  const ownerCookie = cookies(login);
  const state = await (
    await request('/api/state', 'GET', undefined, ownerCookie)
  ).json();
  assert.equal(state.assets.length, 5);
  const create = await request(
    '/api/assets',
    'POST',
    { name: 'Production route synthetic test', category: 'other', value: 321 },
    ownerCookie,
  );
  assert.equal(create.status, 200);
  const family = await request(
    '/api/auth',
    'POST',
    { action: 'demo', role: 'FAMILY' },
    ownerCookie,
  );
  assert.equal(family.status, 200);
  const familyCookie = cookies(family);
  const restricted = await (
    await request('/api/state', 'GET', undefined, familyCookie)
  ).json();
  assert.equal(restricted.assets.length, 0);
  assert.equal(restricted.tasks.length, 6);
  const guidance = await request(
    '/api/assistant',
    'POST',
    { message: 'เริ่มติดต่อธนาคารอย่างไร', includeContext: true },
    familyCookie,
  );
  assert.equal(guidance.status, 200);
  assert.equal((await guidance.json()).mode, 'guided');
  const realFamily = await request('/api/auth', 'POST', {
    action: 'register',
    role: 'FAMILY',
    name: 'Synthetic',
    email: 'blocked@example.test',
    password: 'synthetic-password',
    consent: true,
  });
  assert.equal(realFamily.status, 503);
  assert.equal(
    (await request('/api/account', 'DELETE', undefined, ownerCookie)).status,
    200,
  );
  assert.equal(
    (await request('/api/state', 'GET', undefined, familyCookie)).status,
    401,
  );
  console.log(
    'Production HTTP smoke passed: PostgreSQL auth/CRUD, Secure sessions, family isolation, assistant, verification gate and deletion.',
  );
} finally {
  child.kill('SIGTERM');
  await new Promise((resolve) => child.once('exit', resolve));
}
