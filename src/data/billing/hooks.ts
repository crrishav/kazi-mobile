import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { billingKeys } from './keys';
import * as api from './mock-api';
import type { Invoice, OpenChallan, Payment } from './types';

export function useInvoices() {
  return useQuery({ queryKey: billingKeys.invoices(), queryFn: api.fetchInvoices });
}

export function useAddInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoice: Invoice) => api.addInvoice(invoice),
    onMutate: async (invoice) => {
      await queryClient.cancelQueries({ queryKey: billingKeys.invoices() });
      queryClient.setQueryData<Invoice[]>(billingKeys.invoices(), (old) => [invoice, ...(old ?? [])]);
    },
  });
}

interface PaymentContext {
  previous?: Invoice[];
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { invoiceId: string; payment: Payment }, PaymentContext>({
    mutationFn: ({ invoiceId, payment }) => api.addPayment(invoiceId, payment),
    onMutate: async ({ invoiceId, payment }) => {
      await queryClient.cancelQueries({ queryKey: billingKeys.invoices() });
      const previous = queryClient.getQueryData<Invoice[]>(billingKeys.invoices());
      queryClient.setQueryData<Invoice[]>(billingKeys.invoices(), (old) =>
        (old ?? []).map((v) => (v.id === invoiceId ? { ...v, payments: [...v.payments, payment] } : v)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(billingKeys.invoices(), context.previous);
    },
  });
}

/** Undo restores the pre-payment snapshot the screen captured — mirrors the prototype's own snapshot-based undo. */
export function useRestoreInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (previous: Invoice[]) => api.restoreInvoices(previous),
    onMutate: async (previous) => {
      await queryClient.cancelQueries({ queryKey: billingKeys.invoices() });
      queryClient.setQueryData<Invoice[]>(billingKeys.invoices(), previous);
    },
  });
}

export function useOpenChallans() {
  return useQuery({ queryKey: billingKeys.openChallans(), queryFn: api.fetchOpenChallans });
}

export function useRemoveOpenChallan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeOpenChallan(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: billingKeys.openChallans() });
      queryClient.setQueryData<OpenChallan[]>(billingKeys.openChallans(), (old) => (old ?? []).filter((c) => c.id !== id));
    },
  });
}
