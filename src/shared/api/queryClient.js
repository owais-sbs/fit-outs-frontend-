import { QueryClient } from "@tanstack/react-query";

export const STALE_TIMES = {
  STATIC: 5 * 60 * 1000,    // 5 minutes (Projects, Catalogs, Reference Data)
  STANDARD: 1 * 60 * 1000,  // 1 minute (Tasks, Snags, Submittals, Claims)
  REALTIME: 0,              // 0 seconds (Notifications, Live Feeds)
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.STATIC,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
