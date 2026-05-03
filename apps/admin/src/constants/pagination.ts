export const DEFAULT_GRID_PAGE_SIZE = 20;
export const DEFAULT_GRID_PAGE_SIZES = [10, 20, 50, 100];

export const DEFAULT_GRID_PAGER_CONFIG = {
  enabled: true,
  pageSize: DEFAULT_GRID_PAGE_SIZE,
  pageSizes: DEFAULT_GRID_PAGE_SIZES,
} as const;
