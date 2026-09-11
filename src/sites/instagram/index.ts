/**
 * The Instagram site module.
 *
 * Proof that the site layer is not Facebook-specific: selectors, cleaners and
 * settings are its own, and it reuses the shared runtime, hider and observer
 * without changes.
 */
import { RULES, type RuleKey } from '../../shared/constants';
import type { ExtensionSettings } from '../../shared/types';
import { restoreRules } from '../shared/hider';
import type { SiteModule } from '../shared/runtime';
import { applyInstagramPostCleanup } from './cleaners/posts';
import { applyInstagramStoryCleanup } from './cleaners/stories';
import { instagramObserveRoot } from './observer';

export const INSTAGRAM_RULES: readonly RuleKey[] = [
  RULES.igStoryActions,
  RULES.igPostActionBar,
  RULES.igPostLike,
  RULES.igPostComment,
  RULES.igPostShare,
  RULES.igPostSave,
];

export const instagramSite: SiteModule = {
  name: 'instagram',
  observeRoot: instagramObserveRoot,
  isActive: (settings) => settings.instagram.enabled,

  apply(settings: ExtensionSettings) {
    if (!settings.instagram.enabled) {
      restoreRules(INSTAGRAM_RULES);
      return;
    }
    applyInstagramStoryCleanup(settings);
    applyInstagramPostCleanup(settings);
  },

  onRouteChange() {
    restoreRules(INSTAGRAM_RULES);
  },
};
