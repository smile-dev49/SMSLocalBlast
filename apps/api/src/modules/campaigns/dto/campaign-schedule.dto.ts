import { z } from 'zod';

export const CampaignScheduleBodySchema = z
  .object({
    scheduledAt: z.string().datetime(),
    timezone: z.string().max(64).optional(),
  })
  .strict();

export type CampaignScheduleBody = z.infer<typeof CampaignScheduleBodySchema>;
