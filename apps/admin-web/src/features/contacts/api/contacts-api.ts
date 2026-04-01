import { httpRequest } from '@/core/network/http-client';

export interface ContactCustomFieldEntry {
  readonly fieldKey: string;
  readonly fieldValue: string;
  readonly valueType: string;
}

/** Contact as returned by the API (list and get). */
export interface ContactRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly createdByUserId: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly fullName: string | null;
  readonly phoneNumber: string;
  readonly normalizedPhoneNumber: string;
  readonly email: string | null;
  readonly status: string;
  readonly source: string;
  readonly notes: string | null;
  readonly metadata: unknown;
  readonly lastContactedAt: string | null;
  readonly optedOutAt: string | null;
  readonly blockedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly customFields: readonly ContactCustomFieldEntry[];
  readonly mergeFields: Record<string, string>;
}

export interface ContactListResponse {
  readonly items: readonly ContactRecord[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export const contactsApi = {
  list: (
    params: {
      readonly page?: number;
      readonly limit?: number;
      readonly search?: string;
      readonly status?: string;
    } = {},
  ) => {
    const p = new URLSearchParams();
    if (params.page !== undefined) p.set('page', String(params.page));
    if (params.limit !== undefined) p.set('limit', String(params.limit));
    if (params.search) p.set('search', params.search);
    if (params.status) p.set('status', params.status);
    const qs = p.toString();
    return httpRequest<ContactListResponse>(`/contacts${qs ? `?${qs}` : ''}`);
  },

  get: (contactId: string) => httpRequest<ContactRecord>(`/contacts/${contactId}`),
};
