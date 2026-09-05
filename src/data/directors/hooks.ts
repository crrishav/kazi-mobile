import { useQuery } from '@tanstack/react-query';

import { directorsKeys } from './keys';
import * as api from './api';

/** Roles, their descriptions, who holds them and what they can reach. */
export function useRoleDirectory() {
  return useQuery({ queryKey: directorsKeys.directory(), queryFn: api.fetchRoleDirectory });
}
