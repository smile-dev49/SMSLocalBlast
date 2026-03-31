import { z } from 'zod';

export const CampaignIdParamSchema = z.string().min(1);
