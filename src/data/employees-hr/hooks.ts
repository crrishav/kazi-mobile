import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/data/notifications/notify';

import { employeesKeys } from './keys';
import * as api from './api';
import type { Employee, MonthKey } from './types';

export function useEmployees() {
  return useQuery({ queryKey: employeesKeys.list(), queryFn: api.fetchEmployees });
}

export function useAddEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employee: Employee) => api.addEmployee(employee),
    onMutate: async (employee) => {
      await queryClient.cancelQueries({ queryKey: employeesKeys.list() });
      queryClient.setQueryData<Employee[]>(employeesKeys.list(), (old) => [...(old ?? []), employee]);
    },
    onSuccess: (_data, employee) => {
      notify({ eventType: 'employee.added', section: 'employees-hr', payload: { label: employee.name } });
    },
  });
}

interface UpdateContext {
  previous?: Employee[];
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; updates: Partial<Employee> }, UpdateContext>({
    mutationFn: ({ id, updates }) => api.updateEmployee(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: employeesKeys.list() });
      const previous = queryClient.getQueryData<Employee[]>(employeesKeys.list());
      queryClient.setQueryData<Employee[]>(employeesKeys.list(), (old) => (old ?? []).map((e) => (e.id === id ? { ...e, ...updates } : e)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(employeesKeys.list(), context.previous);
    },
    onSuccess: (_data, { id, updates }, context) => {
      if (updates.active !== false) return;
      const emp = context?.previous?.find((e) => e.id === id);
      if (emp?.active === false) return;
      notify({
        eventType: 'employee.deactivated',
        section: 'employees-hr',
        payload: { label: emp?.name, employee: emp?.name },
      });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteEmployee(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: employeesKeys.list() });
      const removed = queryClient.getQueryData<Employee[]>(employeesKeys.list())?.find((e) => e.id === id);
      queryClient.setQueryData<Employee[]>(employeesKeys.list(), (old) => (old ?? []).filter((e) => e.id !== id));
      return { removed };
    },
    onSuccess: (_data, _id, context) => {
      if (!context?.removed) return;
      notify({
        eventType: 'employee.deactivated',
        section: 'employees-hr',
        payload: { label: context.removed.name, employee: context.removed.name },
      });
    },
  });
}

export function useRestoreEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (previous: Employee[]) => api.restoreEmployees(previous),
    onMutate: async (previous) => {
      await queryClient.cancelQueries({ queryKey: employeesKeys.list() });
      queryClient.setQueryData<Employee[]>(employeesKeys.list(), previous);
    },
  });
}

export function useApprovals() {
  return useQuery({ queryKey: employeesKeys.approvals(), queryFn: api.fetchApprovals });
}

export function useApproveMonth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: MonthKey) => api.approveMonth(key),
    onMutate: async (key) => {
      await queryClient.cancelQueries({ queryKey: employeesKeys.approvals() });
      queryClient.setQueryData<Record<string, boolean>>(employeesKeys.approvals(), (old) => ({ ...(old ?? {}), [key]: true }));
    },
    onSuccess: (_data, key) => {
      notify({ eventType: 'payroll.run_finalised', section: 'employees-hr', payload: { label: key } });
    },
  });
}
