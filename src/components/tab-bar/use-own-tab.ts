import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import type { SectionId } from '@/auth/permissions';
import { tabLayoutFor } from '@/auth/tab-layout';

import { useHideTabBar } from './tab-bar-visibility';

/**
 * Is this module one of the signed-in person's bottom-bar buttons?
 *
 * Production, Billing, Marketing and Chat are tabs for some positions and
 * More-hub screens for the rest, so their headers can't decide statically
 * whether a back chevron belongs. When the module is your tab it is a root
 * destination and the chevron is noise; when you arrived from More or a
 * dashboard quick link, it is the way out.
 */
export function useIsOwnTab(section: SectionId): boolean {
  const { profile, role } = useAuth();
  return tabLayoutFor(profile?.positionId, role).some((slot) => slot.section === section);
}

export interface ModulePresentation {
  /** A root destination for this person: no chevron, bar stays. */
  isOwnTab: boolean;
  /** Pass straight to `ScreenHeader`. */
  showBack: boolean;
  /**
   * Extra bottom padding a pushed presentation needs. These screens live in
   * `(tabs)`, so their scene normally stops above the bar and anything pinned
   * to the bottom can sit at a flat offset. With the bar folded away the scene
   * runs to the edge of the display, and that offset would put a FAB or an
   * action bar under the gesture area.
   */
  bottomInset: number;
}

/**
 * The two presentations a dual-nature module has to support, resolved once.
 *
 * A module that isn't in your bar was reached from More or a dashboard link,
 * and should behave like every other pushed screen: the bottom bar folds away
 * so it isn't offering to jump somewhere else mid-task, and the header's
 * chevron takes you back where you came from. For whoever *does* live in it,
 * nothing changes — it is still their root destination.
 */
export function useModulePresentation(section: SectionId): ModulePresentation {
  const isOwnTab = useIsOwnTab(section);
  const insets = useSafeAreaInsets();

  useHideTabBar(!isOwnTab);

  return { isOwnTab, showBack: !isOwnTab, bottomInset: isOwnTab ? 0 : insets.bottom };
}
