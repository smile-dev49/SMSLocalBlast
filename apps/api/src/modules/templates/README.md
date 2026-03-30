# Templates Module

Organization-scoped reusable message templates and personalization rendering foundation.

## Responsibilities

- Template CRUD (soft-delete aware)
- Placeholder extraction + validation
- Rendering with merge fields (`strict` / `empty` missing-variable strategy)
- Stored-template preview rendering by direct mergeFields or `contactId`
- SMS length/segment estimation metadata

## Placeholder syntax

- Supported: `{{FirstName}}`, `{{Balance}}`, `{{AppointmentDate}}`
- Key format: `^[A-Za-z][A-Za-z0-9_]*$`
- Plain variable substitution only (no expressions, no code execution)
