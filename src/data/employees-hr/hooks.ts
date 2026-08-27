import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { employeesKeys } from './keys';
import * as api from './mock-api';
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
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteEmployee(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: employeesKeys.list() });
      queryClient.setQueryData<Employee[]>(employeesKeys.list(), (old) => (old ?? []).filter((e) => e.id !== id));
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
  });
}
