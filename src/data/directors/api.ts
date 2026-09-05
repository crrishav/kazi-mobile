/**
 * Data-source selector for the role register.
 *   reads → Supabase when configured (a failed read throws; no mock fallback)
 *
 * Read-only: roles and the permission matrix are edited in the web app's admin
 * panel, and `position_permissions` only accepts writes from `admin` editors.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { liveRead } from '@/lib/supabase/read';

import * as live from './supabase';
import * as mock from './mock-api';

export const fetchRoleDirectory = isSupabaseConfigured
  ? liveRead('directors', live.fetchRoleDirectory)
  : mock.fetchRoleDirectory;
