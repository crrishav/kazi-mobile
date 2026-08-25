import { useQuery } from '@tanstack/react-query';

import { directorsKeys } from './keys';
import * as api from './mock-api';

export function useDirectors() {
  return useQuery({ queryKey: directorsKeys.list(), queryFn: api.fetchDirectors });
}
