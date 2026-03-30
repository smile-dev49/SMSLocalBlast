import type { PaginationMeta, PaginatedResponse } from '../types/paginated-response.types';

export function createPaginationMeta(args: {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}): PaginationMeta {
  const totalPages = args.limit > 0 ? Math.ceil(args.total / args.limit) : 0;
  return {
    page: args.page,
    limit: args.limit,
    total: args.total,
    totalPages,
  };
}

export function createPaginatedResponse<T>(args: {
  readonly items: readonly T[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}): PaginatedResponse<T> {
  const meta = createPaginationMeta({ page: args.page, limit: args.limit, total: args.total });
  return {
    items: args.items,
    page: meta.page,
    limit: meta.limit,
    total: meta.total,
    totalPages: meta.totalPages,
  };
}
