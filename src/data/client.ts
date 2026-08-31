import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is now live Firestore shared with the web ERP, so it can change
      // under us. Keep a short stale window (snappy navigation) but re-read on
      // every screen mount so an edit made elsewhere shows up on the next visit.
      staleTime: 1000 * 15,
      refetchOnMount: 'always',
      retry: 1,
    },
  },
});
