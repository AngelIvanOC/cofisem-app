import { useState, useMemo } from "react";

export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage   = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page:       safePage,
    setPage,
    totalPages,
    paginated,
    total:      items.length,
    pageSize,
  };
}
