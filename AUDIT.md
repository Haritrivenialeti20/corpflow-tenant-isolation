# CorpFlow Pre-Refactor Audit

This audit was written before the schema and API refactor. It is the contract for the security changes in this PR.

## Findings

1. **No tenant identity exists.** The original `users`, `projects`, and `billing_details` tables have no `tenant_id`. A query without an application filter returns every organisation's records.
2. **Foreign keys do not preserve tenant boundaries.** `projects.owner_id` references only `users.id`, so a project in one organisation could point to a user in another organisation.
3. **Sensitive data is unclassified and exposed.** `users.salary`, `billing_details.card_last4`, and billing amounts are returned as ordinary columns. No role policy identifies who may see them.
4. **Roles are unconstrained.** `users.role` is a free-form string, so misspellings or invented roles can bypass authorization branches.
5. **No role-aware response mapping exists.** Returning raw database rows would expose salary and payment fields to managers and ordinary users.
6. **No indexes support tenant-scoped access.** Tenant filters would scan the entire shared tables as the system grows.
7. **No isolation tests exist.** The starter does not prove that Tenant A cannot retrieve Tenant B's users, projects, or billing data.
8. **Billing records have no ownership boundary.** A billing row cannot be tied to a specific tenant, making cross-tenant reporting unavoidable.

## Required outcome

Every tenant-specific table must carry a non-null tenant key; relationships must use composite tenant-aware foreign keys; roles must be constrained; sensitive fields must be removed from unauthorized API responses; tenant-scoped indexes and isolation tests must be present.
