import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tasksKeys } from './keys';
import * as api from './mock-api';
import type { Task } from './types';

export function useTasks() {
  return useQuery({ queryKey: tasksKeys.list(), queryFn: api.fetchTasks });
}

export function useSaveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: Task) => api.saveTask(task),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.list() });
      const previous = queryClient.getQueryData<Task[]>(tasksKeys.list());
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        const list = old ?? [];
        const exists = list.some((t) => t.id === task.id);
        return exists ? list.map((t) => (t.id === task.id ? task : t)) : [task, ...list];
      });
      return { previous };
    },
    onError: (_err, _task, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKeys.list(), context.previous);
    },
  });
}

interface DeleteContext {
  previous?: Task[];
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Task, DeleteContext>({
    mutationFn: (task) => api.deleteTask(task.id),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.list() });
      const previous = queryClient.getQueryData<Task[]>(tasksKeys.list());
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => (old ?? []).filter((t) => t.id !== task.id));
      return { previous };
    },
    onError: (_err, _task, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKeys.list(), context.previous);
    },
  });
}

export function useUndoDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ task, index }: { task: Task; index: number }) => api.restoreTask(task, index),
    onMutate: async ({ task, index }) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.list() });
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        const next = (old ?? []).slice();
        next.splice(Math.min(index, next.length), 0, task);
        return next;
      });
    },
  });
}
