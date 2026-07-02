import { useState } from "react";

export const usePagination = () => {
  const [page, setPage] = useState(1);
  const incrementPage = () => setPage(page + 1);
  const decrementPage = () => setPage(page - 1);
  return { page, setPage, incrementPage, decrementPage };
};
