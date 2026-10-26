# CorpFlow Security Decisions

## Tenant isolation

`tenant_id` is mandatory on `users`, `projects`, and `billing_details`. Every read in the API requires a tenant context and filters by it. Composite foreign keys ensure that a project owner belongs to the same tenant as the project; an ID alone is not a sufficient boundary.

The API rejects missing or unknown tenant context. It never accepts a client-supplied tenant ID without applying the requester's tenant context in the same authorization decision.

## Sensitive fields

- `users.salary`: confidential compensation data; visible only to an admin requesting data for their own tenant.
- `billing_details.card_last4`: payment-adjacent data; visible only to an admin for their own tenant.
- `billing_details.amount`: tenant financial data; visible only to an admin for their own tenant.
- `users.email`: identity data; included for admin and manager views, but omitted from ordinary user views of other people.

## Role policy

- **Admin:** all users, salary, billing details, and all projects within the tenant.
- **Manager:** team members and tenant projects, but never salary or billing fields. This prototype treats all users in the tenant as the manager's team after the tenant boundary is enforced.
- **User:** own profile and projects owned by the requesting user; no other user records, salary, or billing details.

## Response mapping

The server maps records into safe response objects. It does not serialize raw database rows. Salary, card suffixes, and billing amounts are added only inside the admin branch. A user request for another person's record returns an empty result rather than a cross-tenant or cross-user row.

## Cross-tenant risks and mitigations

1. A missing `WHERE tenant_id = ?` can expose shared-table rows. The API's query helpers always receive the tenant context and filter before role logic.
2. A project owner from another tenant could be attached through `owner_id` alone. The composite `(tenant_id, owner_id)` foreign key prevents that at the database boundary.
3. A join can reintroduce another tenant's row even when the first table is filtered. Relationship queries use the same tenant key and the schema makes mismatched ownership invalid.
4. Tenant-scoped indexes are added to make secure filters the fast path as data grows.
5. This prototype uses in-memory fixtures for a deterministic smoke test. Production deployment must use parameterized queries, authenticated session claims, PostgreSQL Row-Level Security, secret management, TLS, audit logging, and least-privilege database credentials.
