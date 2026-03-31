# Campaigns API

Organization-scoped campaigns orchestrate **recipient targeting**, **template-based snapshots**, **scheduling**, and a **status lifecycle**. This milestone does **not** send SMS or enqueue BullMQ jobs; it prepares persisted `CampaignRecipient` rows for a future execution pipeline.

## Model overview

### Campaign

- Core fields: `name`, `description`, `status`, optional `templateId`, optional `scheduledAt` / `timezone`, counters (`recipientCount`, `readyCount`, `skippedCount`, send/delivery/failed counts for future use).
- `target` (JSON): `{ "contactIds": string[], "contactListIds": string[] }` — persisted so snapshots can be regenerated on **start** / updates.
- `missingVariableStrategy`: `strict` | `empty` (stored as string, default `empty`).
- Soft delete: `deletedAt` set on delete; lists exclude deleted campaigns.

### CampaignRecipient (snapshot)

Each row is a **point-in-time** record for one normalized phone in the campaign:

- `normalizedPhoneNumber`, `resolvedName`, `mergeFields` (JSON), optional `renderedBody` (when a template exists at preparation time).
- `sourceType`: `DIRECT_CONTACT`, `CONTACT_LIST`, or reserved `IMPORT_SNAPSHOT`.
- `sourceRefId`: list id when sourced from a list; null for direct contacts.
- `status` / `skipReason`: compliance and template outcomes are reflected without mutating live contacts.

## Targeting rules

1. Contacts must belong to the current organization; **deleted** contacts never appear.
2. Contact lists must exist, not be **deleted**, and must not be **archived** (archived lists are rejected with `400`).
3. **Dedup**: after sorting contacts by id, duplicates sharing the same `normalizedPhoneNumber` collapse to a single recipient (first wins). Others are not emitted as extra rows.
4. **Direct vs list**: if a contact is both listed and passed in `contactIds`, `DIRECT_CONTACT` wins for `sourceType`.

## Skipped recipients

Non-sendable contacts are stored as `SKIPPED` with stable machine reasons:

| Reason                              | Meaning                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `CONTACT_BLOCKED`                   | Contact status `BLOCKED`                                                                        |
| `CONTACT_OPTED_OUT`                 | Contact status `OPTED_OUT`                                                                      |
| `CONTACT_ARCHIVED`                  | Contact status `ARCHIVED`                                                                       |
| `TEMPLATE_STRICT_MISSING_VARIABLES` | Strict rendering could not fill all placeholders (invalid body is rejected before per-row work) |

Default snapshot strategy is **`empty`**: missing merge fields become empty string segments. **`strict`** skips the affected recipient with `TEMPLATE_STRICT_MISSING_VARIABLES`.

## Scheduling & lifecycle

Statuses: `DRAFT`, `SCHEDULED`, `PROCESSING`, `PAUSED`, `COMPLETED`, `CANCELLED`, `FAILED`.

| Transition                           | From → To                                        | Notes                                                                               |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **Create** with future `scheduledAt` | → `SCHEDULED`                                    | Validates `scheduledAt` in the future                                               |
| **Create** without schedule          | → `DRAFT`                                        |                                                                                     |
| **POST …/schedule**                  | `DRAFT` or `PAUSED` → `SCHEDULED`                | Requires future `scheduledAt`                                                       |
| **POST …/start**                     | `DRAFT`, `SCHEDULED`, or `PAUSED` → `PROCESSING` | Refreshes recipient snapshots from current contacts + template                      |
| **POST …/pause**                     | `SCHEDULED` or `PROCESSING` → `PAUSED`           |                                                                                     |
| **POST …/cancel**                    | Non-terminal → `CANCELLED`                       | Sets `PENDING` / `READY` / `QUEUED` recipients to `CANCELLED`; refreshes aggregates |

Terminal states (`COMPLETED`, `CANCELLED`, `FAILED`) cannot be cancelled again.

## Preview (`POST /campaigns/preview`)

Read-only: resolves targets, applies skip rules, optionally renders with `templateId` **or** inline `templateBody`, returns counts, skip summary, segment estimates (~160 chars first segment, ~153 concat), and a limited `sampleRenderedRecipients`. Does not write to the database.

## Permissions (seeded)

- `campaigns.read` — list, get, summary
- `campaigns.write` — create, update, delete
- `campaigns.manage` — reserved for future stricter admin actions (seeded on elevated roles)
- `campaigns.execute` — schedule, start, pause, cancel
- `campaigns.preview` — preview endpoint

**org_member**: `read`, `preview`. **org_manager** and above: write/manage/execute as seeded in `bootstrap-default-rbac.ts`.

## Audit events

Emits (structured logs today): `CAMPAIGN_CREATED`, `CAMPAIGN_UPDATED`, `CAMPAIGN_DELETED`, `CAMPAIGN_PREVIEWED`, `CAMPAIGN_SCHEDULED`, `CAMPAIGN_STARTED`, `CAMPAIGN_PAUSED`, `CAMPAIGN_CANCELLED`, `CAMPAIGN_RECIPIENTS_PREPARED`. No per-recipient audit spam.

## Future queue integration

Workers should treat `CampaignRecipient` rows as authoritative: send `READY`/`QUEUED` rows, update per-recipient status and campaign aggregate counters (`sentCount`, `failedCount`, etc.), and move the campaign to `COMPLETED` or `FAILED` when the batch finishes. Preparation logic is centralized in `CampaignRecipientsService.replaceRecipientsTransaction` and reused on create/update (draft-like states) and **start**.
