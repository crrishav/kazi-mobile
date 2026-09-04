import { useAuth } from '@/auth/auth-context';
import type { SectionId } from '@/auth/permissions';
import { tabLayoutFor } from '@/auth/tab-layout';

/**
 * Is this module one of the signed-in person's bottom-bar buttons?
 *
 * Production, Orders, Billing, Marketing and Chat are tabs for some positions
 * and More-hub screens for the rest, so their headers can't decide statically
 * whether a back chevron belongs. When the module is your tab it is a root
 * destination and the chevron is noise; when you arrived from More or a
 * dashboard quick link, it is the way out.
 */
export function useIsOwnTab(section: SectionId): boolean {
  const { profile, role } = useAuth();
  return tabLayoutFor(profile?.positionId, role).some((slot) => slot.section === section);
}
