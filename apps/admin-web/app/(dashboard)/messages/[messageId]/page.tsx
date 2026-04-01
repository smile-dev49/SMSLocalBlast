import type { ReactElement } from 'react';

import { MessageDetailPage } from '@/features/messages/components/message-detail-page';

export default async function Page(
  props: Readonly<{ params: Promise<{ messageId: string }> }>,
): Promise<ReactElement> {
  const { messageId } = await props.params;
  return <MessageDetailPage messageId={messageId} />;
}
