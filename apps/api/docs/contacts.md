# Contacts API (Excel-Ready Foundation)

Contacts are organization-scoped recipients intended for Excel/CSV/XLSX ingestion and later campaign personalization.

## Permissions

- `contacts.read`
- `contacts.write`
- `contacts.manage`
- `contact-lists.read`
- `contact-lists.write`
- `imports.contacts`

## Contact model

- Core identity: `phoneNumber`, `normalizedPhoneNumber`
- Status lifecycle: `ACTIVE`, `BLOCKED`, `OPTED_OUT`, `ARCHIVED`
- Source tracking: `MANUAL`, `CSV_IMPORT`, `XLSX_IMPORT`, `API`, `EXCEL_ADDIN`
- Custom metadata: `metadata` JSON + `ContactCustomFieldValue` rows
- Soft delete: `deletedAt`

## Contact list model

- Lists are org-scoped (`ContactList`)
- Memberships are explicit (`ContactListMembership`)
- List archiving supported (`isArchived`)

## Custom fields + merge fields

- Custom fields are stored in `ContactCustomFieldValue`
- `PUT /contacts/:contactId/custom-fields` performs upsert by (`contactId`, `fieldKey`)
- Contact detail response includes:
  - `customFields[]`
  - derived `mergeFields` map for future template rendering

## Compliance semantics

- `opt-out`: recipient compliance suppression (`status = OPTED_OUT`)
- `block`: internal suppression (`status = BLOCKED`)
- `unblock`: restores `ACTIVE` only for blocked contacts (does not clear `OPTED_OUT`)

## Import architecture (fileless for now)

### `POST /api/v1/contacts/import/preview`

Accepts:

- `sourceType`
- `rows` (array of raw row objects)
- `mapping` (column mapping incl. custom fields)
- `options` (`deduplicateByPhone`, `createListName`, `skipInvalidRows`, `updateExisting`)

Returns:

- totals (`totalRows`, `validRows`, `invalidRows`, `duplicateRows`, `existingMatches`)
- `normalizedSampleRows`
- per-row errors

### `POST /api/v1/contacts/import/confirm`

Accepts same payload for now.

Behavior:

- normalizes rows
- deduplicates by normalized phone
- creates/updates contacts (based on `updateExisting`)
- writes custom fields
- optionally creates a list and attaches imported contacts

## Duplicate matching strategy

- Primary key for matching within org: `normalizedPhoneNumber`
- Preview flags:
  - duplicate rows in payload
  - existing DB matches
- Confirm behavior:
  - skip existing unless `updateExisting=true`
