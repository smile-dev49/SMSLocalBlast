# Templates API

Templates provide reusable SMS/MMS message bodies with plain merge-variable placeholders.

## Model

- `Template` is organization-scoped
- Soft delete via `deletedAt`
- Channel enum: `SMS | MMS`
- Uniqueness: (`organizationId`, `name`)

## Placeholder syntax

- Form: `{{VariableName}}`
- Key rules: starts with letter, then letters/numbers/underscore
- Examples:
  - valid: `{{FirstName}}`, `{{Balance}}`
  - invalid: `{{ First Name }}`, `{{balance-total}}`

No expression execution is supported; substitution is plain text only.

## Missing variable strategies

- `strict`: reject rendering if any required variable is missing
- `empty`: replace missing placeholders with empty string

## Endpoints

- `POST /api/v1/templates`
- `GET /api/v1/templates`
- `GET /api/v1/templates/:templateId`
- `PATCH /api/v1/templates/:templateId`
- `DELETE /api/v1/templates/:templateId`
- `POST /api/v1/templates/validate`
- `POST /api/v1/templates/render-preview`
- `POST /api/v1/templates/:templateId/render-preview`

## Validation / preview metadata

Responses include:

- extracted `variables`
- `invalidPlaceholders` (validation endpoint)
- `missingVariables` (render endpoints)
- message `length`
- `estimatedSegments`
- `isLongMessage`

### Segment estimation assumptions

- single segment up to 160 chars
- concatenated estimate uses 153 chars per segment

## Contact merge-field integration

Stored-template preview endpoint supports `contactId`:

- resolves merge fields from contacts module (built-in fields + custom fields)
- renders within current organization scope
- no state mutations

## Audit events

- `TEMPLATE_CREATED`
- `TEMPLATE_UPDATED`
- `TEMPLATE_DELETED`
- `TEMPLATE_VALIDATED`
- `TEMPLATE_PREVIEW_RENDERED`
