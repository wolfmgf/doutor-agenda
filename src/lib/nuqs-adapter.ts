import { createSearchParamsCache } from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  server: {
    revalidate: 0,
  },
});
