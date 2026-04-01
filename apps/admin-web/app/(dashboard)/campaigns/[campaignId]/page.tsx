import type { ReactElement } from 'react';

import { CampaignDetailPage } from '@/features/campaigns/components/campaign-detail-page';

export default async function Page(
  props: Readonly<{ params: Promise<{ campaignId: string }> }>,
): Promise<ReactElement> {
  const { campaignId } = await props.params;
  return <CampaignDetailPage campaignId={campaignId} />;
}
