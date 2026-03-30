# Contacts Module

Production-grade contacts domain foundation for Excel-first workflows.

## Scope

- Organization-scoped contact CRUD and search
- Contact lists and list memberships
- Contact custom fields (`fieldKey`, `fieldValue`, `valueType`)
- Compliance actions (`opt-out`, `block`, `unblock`)
- Import preview/confirm architecture for CSV/XLSX/Excel add-in row payloads

## Notes

- File upload transport is intentionally not implemented yet; import endpoints accept structured row payloads.
- `normalizedPhoneNumber` is the primary identity key per organization.
- Campaign/message relations are intentionally deferred to later modules.
