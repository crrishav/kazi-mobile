import { useQuery } from '@tanstack/react-query';

import { changelogKeys } from './keys';
import * as api from './mock-api';

export function useReleases() {
  return useQuery({ queryKey: changelogKeys.releases(), queryFn: api.fetchReleases });
}
