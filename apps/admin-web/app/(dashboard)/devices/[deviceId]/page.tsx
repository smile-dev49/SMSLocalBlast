import type { ReactElement } from 'react';

import { DeviceDetailPage } from '@/features/devices/components/device-detail-page';

export default async function Page(
  props: Readonly<{ params: Promise<{ deviceId: string }> }>,
): Promise<ReactElement> {
  const { deviceId } = await props.params;
  return <DeviceDetailPage deviceId={deviceId} />;
}
