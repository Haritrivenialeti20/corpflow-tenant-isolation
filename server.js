const http = require('http');
const { URL } = require('url');

const tenants = [
  { id: 1, name: 'Acme Health' },
  { id: 2, name: 'Northstar Labs' },
];
const users = [
  { id: 101, tenantId: 1, name: 'Ava Admin', email: 'ava@acme.test', role: 'admin', salary: 150000 },
  { id: 102, tenantId: 1, name: 'Mina Manager', email: 'mina@acme.test', role: 'manager', salary: 110000 },
  { id: 103, tenantId: 1, name: 'Uma User', email: 'uma@acme.test', role: 'user', salary: 80000 },
  { id: 201, tenantId: 2, name: 'Noah Admin', email: 'noah@northstar.test', role: 'admin', salary: 160000 },
];
const projects = [
  { id: 1001, tenantId: 1, title: 'Patient Portal', ownerId: 103 },
  { id: 1002, tenantId: 1, title: 'Payroll Migration', ownerId: 102 },
  { id: 2001, tenantId: 2, title: 'Orbital Analytics', ownerId: 201 },
];
const billing = [
  { id: 5001, tenantId: 1, customerName: 'Acme Health', cardLast4: '4242', amount: 2999 },
  { id: 5002, tenantId: 2, customerName: 'Northstar Labs', cardLast4: '1881', amount: 4999 },
];

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
function tenantRows(rows, tenantId) { return rows.filter(row => row.tenantId === tenantId); }
function requester(query) {
  const tenantId = Number(query.get('tenantId'));
  const requesterId = Number(query.get('requesterId'));
  const user = users.find(item => item.id === requesterId && item.tenantId === tenantId);
  return user ? { tenantId, user } : null;
}
function safeUser(row, actor) {
  if (actor.user.role === 'user' && row.id !== actor.user.id) return null;
  const result = { id: row.id, name: row.name, role: row.role };
  if (actor.user.role !== 'user') result.email = row.email;
  if (actor.user.role === 'admin') result.salary = row.salary;
  return result;
}
function safeProject(row, actor) {
  if (actor.user.role === 'user' && row.ownerId !== actor.user.id) return null;
  return { id: row.id, title: row.title, ownerId: row.ownerId };
}
function route(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, service: 'corpflow', isolation: 'tenant-scoped' });
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  const actor = requester(url.searchParams);
  if (!actor) return json(res, 403, { error: 'valid tenant context and requester are required' });

  if (url.pathname === '/api/users') {
    const result = tenantRows(users, actor.tenantId).map(row => safeUser(row, actor)).filter(Boolean);
    return json(res, 200, { tenantId: actor.tenantId, role: actor.user.role, users: result });
  }
  if (url.pathname === '/api/projects') {
    const result = tenantRows(projects, actor.tenantId).map(row => safeProject(row, actor)).filter(Boolean);
    return json(res, 200, { tenantId: actor.tenantId, role: actor.user.role, projects: result });
  }
  if (url.pathname === '/api/billing') {
    if (actor.user.role !== 'admin') return json(res, 403, { error: 'billing is restricted to tenant admins' });
    const result = tenantRows(billing, actor.tenantId).map(row => ({ id: row.id, customerName: row.customerName, cardLast4: row.cardLast4, amount: row.amount }));
    return json(res, 200, { tenantId: actor.tenantId, billing: result });
  }
  return json(res, 404, { error: 'not_found' });
}
const port = Number(process.env.PORT || 4175);
const server = http.createServer(route);
server.listen(port, '0.0.0.0', () => console.log(`CorpFlow listening on ${port}`));
