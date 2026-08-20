export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 24;
export const MAX_LIMIT = 100;

export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  nextPage: number | null;
  previousPage: number | null;
};

export function normalizePagination(query: PaginationQuery = {}): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(DEFAULT_PAGE, query.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT));

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}

export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const pages = Math.max(1, Math.ceil(total / limit) || 1);

  return {
    total,
    page,
    limit,
    pages,
    nextPage: page < pages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
  };
}
