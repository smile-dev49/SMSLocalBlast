import { isOfficeReady } from '@/core/office/workbook-service';

export interface BootstrapState {
  officeReady: boolean;
}

export async function bootstrapApp(): Promise<BootstrapState> {
  const officeReady = await isOfficeReady().catch(() => false);
  return { officeReady };
}
