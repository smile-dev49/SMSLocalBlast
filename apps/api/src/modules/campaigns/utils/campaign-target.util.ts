import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import type { CampaignTargetPersisted } from '../types/campaign.types';

const TargetShape = z.object({
  contactIds: z.array(z.string()),
  contactListIds: z.array(z.string()),
});

export function parsePersistedTarget(
  value: Prisma.JsonValue | null | undefined,
): CampaignTargetPersisted {
  if (value === null || value === undefined) {
    return { contactIds: [], contactListIds: [] };
  }
  const parsed = TargetShape.safeParse(value);
  if (!parsed.success) {
    return { contactIds: [], contactListIds: [] };
  }
  return {
    contactIds: [...parsed.data.contactIds],
    contactListIds: [...parsed.data.contactListIds],
  };
}

export function toPersistedTargetJson(target: CampaignTargetPersisted): Prisma.InputJsonValue {
  return {
    contactIds: [...target.contactIds],
    contactListIds: [...target.contactListIds],
  };
}
