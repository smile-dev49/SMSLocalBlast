## Campaigns module

Orchestrates **campaign CRUD**, **contact/list targeting**, **recipient snapshot generation** (merge fields + optional rendered template body), **preview** (non-persistent), **scheduling / lifecycle** transitions, and **summary** reporting.

### Key services

- `CampaignsService` — HTTP-facing workflows, audit, aggregates orchestration.
- `CampaignRecipientsService` — Resolve targets (org-safe), dedupe by phone, build `CampaignRecipient` rows, template rendering hook via `TemplateRendererService`.
- `CampaignPreviewService` — Ephemeral audience + segment estimates for UX.
- `CampaignStateService` — Valid state transitions (no scattered `if` in controllers).
- `CampaignSchedulerService` — Future `scheduledAt` validation.

### Integration

- **Contacts**: bulk fetch + `ContactsService.mergeFieldsFromContactRow`.
- **Templates**: `TemplatesRepository` + `TemplateVariableService` / `TemplateRendererService` (plain `{{Var}}` substitution only).

Dispatch workers and outbound message tables are **out of scope** for this module version.
