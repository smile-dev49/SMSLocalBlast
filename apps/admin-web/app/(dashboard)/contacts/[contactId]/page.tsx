import type { ReactElement } from 'react';

import { ContactDetailPage } from '@/features/contacts/components/contact-detail-page';

export default async function Page(
  props: Readonly<{ params: Promise<{ contactId: string }> }>,
): Promise<ReactElement> {
  const { contactId } = await props.params;
  return <ContactDetailPage contactId={contactId} />;
}
