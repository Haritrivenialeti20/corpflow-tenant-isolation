# CorpFlow — Tenant Isolation and Role-Aware Data Access

CorpFlow is a shared-database B2B SaaS workforce API hardened against cross-tenant leaks and role-based exposure. The original audit was committed before the refactor in commit `0282106`.

## Live Deployment

Live preview: https://4175-ips6j5fdth1e1ikgtkorw-f16c4bec.sg2.manus.computer/health

The health endpoint returns `tenant-scoped` and the API endpoints accept a tenant context plus requester identity for the deterministic challenge demo.

## Security changes

- Added `tenants` and mandatory `tenant_id` to every tenant-specific table.
- Added composite tenant-aware ownership foreign keys for projects.
- Constrained roles to `admin`, `manager`, and `user`.
- Added tenant-scoped and tenant-plus-email/owner indexes.
- Classified salary, card suffix, and billing amounts as sensitive.
- Mapped API responses by role instead of serializing raw rows.
- Added smoke tests proving cross-tenant access is rejected and sensitive fields are filtered.

## API examples

```text
GET /api/users?tenantId=1&requesterId=101  # admin: all same-tenant users + salary
GET /api/users?tenantId=1&requesterId=102  # manager: same-tenant users, no salary
GET /api/users?tenantId=1&requesterId=103  # user: own profile only
GET /api/billing?tenantId=1&requesterId=102 # 403: manager cannot see billing
GET /api/billing?tenantId=1&requesterId=101 # admin: same-tenant billing only
```

## Verification

```bash
npm run check
npm test
```

Read [AUDIT.md](AUDIT.md) for the pre-refactor findings and [SECURITY.md](SECURITY.md) for the security decisions and residual production risks.
