import { describe, expect, it } from "vitest";
import { normalizePagination, paginationMeta } from "./pagination.js";

describe("pagination", () => {
  it("defaults to page 1 and 24 items", () => {
    expect(normalizePagination()).toEqual({ skip: 0, take: 24, page: 1, limit: 24 });
  });

  it("caps the limit at 100", () => {
    expect(normalizePagination({ page: 2, limit: 500 })).toEqual({
      skip: 100,
      take: 100,
      page: 2,
      limit: 100,
    });
  });

  it("builds next/previous page metadata", () => {
    expect(paginationMeta(50, 1, 24)).toMatchObject({
      total: 50,
      pages: 3,
      nextPage: 2,
      previousPage: null,
    });
    expect(paginationMeta(50, 3, 24)).toMatchObject({
      nextPage: null,
      previousPage: 2,
    });
  });
});
