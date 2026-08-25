export const changelogKeys = {
  all: ['changelog'] as const,
  releases: () => [...changelogKeys.all, 'releases'] as const,
};
