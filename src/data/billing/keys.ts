export const billingKeys = {
  all: ['billing'] as const,
  invoices: () => [...billingKeys.all, 'invoices'] as const,
  openChallans: () => [...billingKeys.all, 'open-challans'] as const,
};
