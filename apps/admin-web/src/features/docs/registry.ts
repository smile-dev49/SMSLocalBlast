import { apiDoc } from './content/api';
import { billingDoc } from './content/billing';
import { campaignsDoc } from './content/campaigns';
import { environmentDoc } from './content/environment';
import { excelAddinDoc } from './content/excel-addin';
import { gettingStartedDoc } from './content/getting-started';
import { messagesDoc } from './content/messages';
import { mobileGatewayDoc } from './content/mobile-gateway';
import { operationsDoc } from './content/operations';
import { troubleshootingDoc } from './content/troubleshooting';
import { workflowsDoc } from './content/workflows';
import type { DocDefinition, DocNavItem } from './types';

const ALL_DOCS: readonly DocDefinition[] = [
  gettingStartedDoc,
  environmentDoc,
  excelAddinDoc,
  mobileGatewayDoc,
  campaignsDoc,
  messagesDoc,
  workflowsDoc,
  billingDoc,
  operationsDoc,
  apiDoc,
  troubleshootingDoc,
];

const bySlug = new Map<string, DocDefinition>(ALL_DOCS.map((d) => [d.slug, d]));

export function getDocBySlug(slug: string): DocDefinition | undefined {
  return bySlug.get(slug);
}

export function listDocs(): readonly DocDefinition[] {
  return ALL_DOCS;
}

/** Sidebar + index: includes launch checklist entry (interactive page, not article body). */
export const DOC_NAV_ITEMS: readonly DocNavItem[] = [
  { slug: 'getting-started', title: gettingStartedDoc.title, category: 'Start' },
  { slug: 'environment', title: environmentDoc.title, category: 'Reference' },
  { slug: 'launch-checklist', title: 'Launch checklist', category: 'Launch' },
  { slug: 'excel-addin', title: excelAddinDoc.title, category: 'Guides' },
  { slug: 'mobile-gateway', title: mobileGatewayDoc.title, category: 'Guides' },
  { slug: 'campaigns', title: campaignsDoc.title, category: 'Guides' },
  { slug: 'messages', title: messagesDoc.title, category: 'Operations' },
  { slug: 'workflows', title: workflowsDoc.title, category: 'Guides' },
  { slug: 'billing', title: billingDoc.title, category: 'Reference' },
  { slug: 'operations', title: operationsDoc.title, category: 'Operations' },
  { slug: 'api', title: apiDoc.title, category: 'Reference' },
  { slug: 'troubleshooting', title: troubleshootingDoc.title, category: 'Reference' },
];

export const INTERACTIVE_DOC_SLUGS = new Set<string>(['launch-checklist']);

export const DOC_ROUTE_SLUGS = new Set<string>(DOC_NAV_ITEMS.map((i) => i.slug));

export function isKnownDocSlug(slug: string): boolean {
  return DOC_ROUTE_SLUGS.has(slug);
}
