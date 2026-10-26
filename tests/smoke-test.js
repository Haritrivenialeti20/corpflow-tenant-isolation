const assert = require('assert');
const http = require('http');
const { spawn } = require('child_process');
const port = 4176;
const base = `http://127.0.0.1:${port}`;

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${base}${path}`, response => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(body) }));
    }).on('error', reject);
  });
}
(async () => {
  const child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port) } });
  await new Promise(resolve => setTimeout(resolve, 250));
  try {
    const health = await get('/health');
    assert.equal(health.status, 200);
    const admin = await get('/api/users?tenantId=1&requesterId=101');
    assert.equal(admin.status, 200);
    assert.equal(admin.body.users.length, 3);
    assert.ok(Object.hasOwn(admin.body.users[0], 'salary'));
    assert.ok(!admin.body.users.some(user => user.email?.includes('northstar')));

    const manager = await get('/api/users?tenantId=1&requesterId=102');
    assert.equal(manager.status, 200);
    assert.equal(manager.body.users.length, 3);
    assert.ok(manager.body.users.every(user => !Object.hasOwn(user, 'salary')));

    const user = await get('/api/users?tenantId=1&requesterId=103');
    assert.equal(user.status, 200);
    assert.deepEqual(user.body.users.map(row => row.id), [103]);
    assert.ok(!Object.hasOwn(user.body.users[0], 'salary'));

    const crossTenant = await get('/api/users?tenantId=2&requesterId=101');
    assert.equal(crossTenant.status, 403);
    const billing = await get('/api/billing?tenantId=1&requesterId=102');
    assert.equal(billing.status, 403);
    const adminBilling = await get('/api/billing?tenantId=1&requesterId=101');
    assert.equal(adminBilling.status, 200);
    assert.equal(adminBilling.body.billing[0].cardLast4, '4242');
    console.log('PASS: tenant isolation, same-tenant ownership, role filtering, and billing protection');
  } finally {
    child.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exit(1); });
