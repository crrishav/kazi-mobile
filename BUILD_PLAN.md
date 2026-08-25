# Kazi Mobile — Build Continuation Plan

Source design: Claude Design project `8b0bd055-9d76-4713-a6cc-2839ebf51432` ("Kazi mobile ERP style guide"), read via `mcp__claude-design__read_file` (project_id above + file path like `"Kazi Production.dc.html"`).

## Status

Phases 0–7 shipped — all 20 of the Claude Design project's screens are built and routed: foundation, Login, Dashboard, Tasks, Inventory, Finance, More hub, Production, Purchases, Quality Control, Budget & Requirements, Sales, Customers, Marketing, Billing, Accounting, Employees & HR, Attendance, Directors, Admin Panel, Messenger, Changelog. `npx tsc --noEmit` was clean as of the last checkpoint and the web bundle verified (1795 modules, no errors). The built code is the source of truth for how those modules work — don't re-read or rebuild them; this file only tracks what's left.

What's left is **Phase 8**: four pages that exist in the reference app ([jenithroy/kazi-app](https://github.com/jenithroy/kazi-app)) but have **no Claude Design screen at all** (confirmed via `mcp__claude-design__list_files` against the reference repo's `src/pages/` tree on 2026-08-25). These need a design made before they can be built the way every other module was — see the Phase 8 section below before starting any of them. Phase 9 (polish/verification) comes after.

## How to read a design file (every file is bigger than the token cap)

Every `Kazi <Module>.dc.html` file is 30–85KB and **will** exceed the single-read token cap. The tool call errors but saves full content to a local temp file and tells you the path — `Read` that file in ~300-line chunks with `offset`/`limit` until you've seen the whole thing (check the reported total line count). Do not summarize from a partial read. The temp file path is session-specific — a new conversation must re-run `mcp__claude-design__read_file` from scratch; nothing from a prior session's reads persists.

Each file has two halves: the HTML/JSX-like markup (visual structure, `{{ bindings }}`) and a `<script type="text/x-dc">` block at the bottom with a `class Component extends DCLogic` — **that class is the real spec**: exact state shape, seed data arrays, computed derived values, and event handlers. Port its logic faithfully; the markup tells you layout/styling.

`support.js` and `Kazi Style Guide.dc.html` / `Canvas.dc.html` are not screens — already fully absorbed into `src/theme/`, skip them.

## Conventions — follow these for every remaining module

**Per-module file shape** (mirror `src/screens/tasks/` + `src/data/tasks/` for a list+filter+sheet pattern; `src/screens/inventory/` for list/detail/multi-step-wizard; `src/screens/finance/` for a multi-view overview/years/ledger pattern with snapshot undo):

```
src/screens/<module>/index.tsx          # exported as a named function, e.g. `export function Production()`
src/screens/<module>/<piece>.tsx        # header, rows, sheets, sub-views — split when a file would otherwise exceed ~150 lines
src/data/<module>/types.ts
src/data/<module>/mock.ts               # seed arrays + static reference/option lists (plain exports, NOT query-wrapped)
src/data/<module>/keys.ts               # `{ all, list: () => [...] }` react-query key factory
src/data/<module>/mock-api.ts           # in-memory `let db = [...seed]`, async functions with simulateLatency() wrapping real-repository-shaped signatures
src/data/<module>/hooks.ts              # useX() query + mutations (optimistic onMutate, onError rollback via cache snapshot)
src/app/(app)/<route>.tsx               # already exists as a `ComingSoon` stub — replace its body with `import { X } from '@/screens/x'; export default function XRoute() { return <X />; }`
```

**Undo — two flavors, pick whichever matches the source file's own logic:**
- Index-based reinsert (Dashboard approvals, Tasks/Quality Control delete): capture `index = list.findIndex(...)` before mutating, a second mutation splices the item back in at that index.
- Snapshot-based (Finance, Purchases, Budget & Requirements, Accounting): capture `const before = list` right before mutating, then `toast.show({ message, tone: 'ok', action: { label: 'Undo', onPress: () => restoreMutation.mutate(before) } })`. A `useRestore<Thing>()` hook in `hooks.ts` just replaces the cached value with the snapshot.

**Reusable UI kit — use these, don't recreate:**
- `components/ui/button.tsx` — variants `primary | secondary | ghost | danger | dangerOutline | invertedSheet`, sizes `default | small`, `loading`, `fullWidth`. `dangerOutline` for Reject/Delete (destructive is never a filled clay button).
- `components/ui/card.tsx` — elevations `flat | raised | sheet | inverted`. For a design's own "one sheet, not cards" hairline-row data table (Accounting's chart-of-accounts/ledger), use a plain `View` with `boxShadow: theme.shadows.card` + `borderTopWidth: StyleSheet.hairlineWidth` per row instead — neither `Card` preset reproduces that shadow.
- `components/ui/status-pill.tsx` — kinds `on-track | at-risk | blocked | draft | shipped`, `label` override for custom wording.
- `components/ui/avatar.tsx` — `Avatar`/`AvatarStack`, tints `dark | mint | clay | draft | amber`, sizes `lg(44) | md(38) | sm(34)`, `shape?: 'tile' | 'circle'` (default `'tile'`; circle for people vs. tile for orgs, when a module actually mixes both). `tintFromSeed(initials)` auto-picks a tint when the design doesn't hardcode one. **A design's own hardcoded per-record `[initials, bg, fg]` hex tuple is almost always one of these 5 tints in disguise** — map to `avatarTint: AvatarTint` on the record rather than carrying raw hex fields.
- `components/ui/kpi-card.tsx` — `delta` is `{ arrow?: 'up'|'down'|'flat', tone: 'good'|'warning'|'bad'|'neutral', text }`. Arrow and tone are independent — read the source file's actual chip color per metric, don't assume up=good.
- `components/ui/text-field.tsx` — `label` optional, `compact` for the smaller mono secondary-field style, `secureTextEntry` auto-renders SHOW/HIDE.
- `components/ui/segmented-proportion-bar.tsx` — flex-weighted multi-segment bar; pass `{ weight: 1, color }` per segment for an equal-weight N-segment stage bar.
- `components/ui/threshold-bar.tsx` — single fill + tick-mark bar, for any "value vs. threshold/target".
- `components/ui/sparkline.tsx`, `spinner.tsx`, `rise-in.tsx` (`RiseIn` = the `kazi-rise` 260ms fade+6px-slide, replays on `viewKey` change), `switch.tsx` (reuse even if a design's inline dimensions differ slightly), `bottom-sheet.tsx` (backdrop fade + sheet slide, manual-timed exit), `empty-state.tsx`, `screen-header.tsx` (back button + title for pushed module screens, `onBack` prop overrides the default `router.back()` for list→detail navigation within a module — NOT for tab roots).
- `components/ui/icon/index.tsx` exports `Icon` (wraps Feather — **verify any icon name is a real Feather glyph first**, no invented names) + 5 hand-ported nav icons. `Icon` has **no `style` prop** — to rotate a chevron, wrap it in `<View style={{ transform: [{ rotate: ... }] }}>`.
- `components/toast/toast-provider.tsx` — global `useToast().show({ message, tone: 'ok'|'warn'|'bad', action? })`, auto-dismiss 4s. `warn` = amber dot via `theme.onDark.warningWashText`.
- `data/mock/delay.ts` — `simulateLatency(ms?)`, every mock-api call wraps with it.

**Other established patterns, applied when a new module's source file calls for the same shape:**
- A full-screen takeover for a fixed "printed document" (Billing's PDF preview, Employees & HR's salary slip) is a `Modal` + `FadeIn`/`FadeOut` (no gesture dismiss), styled in **literal hex, not theme tokens** — the one deliberate exception to always using `useTheme()`, since a printed document must look identical regardless of app theme.
- A compact, non-edge-to-edge confirm dialog (Customers' delete-confirm) is its own small component — margin on all sides, fully rounded corners, fade + small rise — not `BottomSheet`, whenever the design's own sheet has padding around a rounded-all-corners card rather than being flush to the screen edges.
- A sheet needing more than `BottomSheet`'s plain title+close (Directors' detail sheet: avatar+name+meta header, pinned footer buttons below the scroll area) gets a bespoke component that duplicates `BottomSheet`'s Modal/backdrop/slide animation verbatim but swaps header/footer content.
- Swipe-to-reveal-delete row (Customers list): `react-native-gesture-handler`'s `Gesture.Pan().activeOffsetX([-10, 10])` + `GestureDetector`, shared `translateX` clamped to `[-REVEAL, 0]`, parent tracks a single `openId` so only one row is open at a time. See `src/screens/customers/customer-row.tsx`.
- A ledger-style resource where "posting" overlays a change on a base value (Accounting's `adjust`/`adjustments`) uses a delta dict — mock-api holds `Record<id, number>`, undo snapshots `before`/`next` keyed by record id instead of a whole array.
- A fixed status enum with no shared-theme equivalent (Attendance's `present/late/absent/half/leave`) gets its own `STATUS_RAMP` in the module's `mock.ts` — a `{light, dark}` pair of `{dot, chipBg, chipFg, cellBg, cellFg}` per status, reusing the theme's existing wash hexes where the semantics line up and only adding genuinely new hex where they don't.
- A live-ticking value seeded from a query (Attendance's worked-hours clock): the query owns the persisted `{...,elapsedSeconds}` resource, the screen keeps its own counter seeded from that query on first load and ticked by a local `setInterval` — mirrors what a real client/server split would do.
- Heavy derived-value formulas (Billing's `subtotal/vat/total/paid/balance/status`) live in the module's `utils.ts`, imported everywhere they're needed, not recomputed inline per component.
- Model a source script's "raised/logged" sub-resource (Billing's invoices/payments) as fields on the parent object via `mock-api.ts` functions, not as separate state slices glued together at render — matches the one-query-key-per-resource shape everywhere else and what a real backend would look like.
- A design's own dead/unwired buttons (no `onClick` in the source script) still get wired to a toast in the app — a tappable-looking button with zero feedback reads as broken on a real device.
- Design-tool-only `data-props` sliders (variant knobs meant for previewing inside Claude Design itself, e.g. Billing's `vatRate`/`showFxLine`, Employees & HR's `maskAccounts`/`density`, Directors' `groupBy`/`showEmails`) are not real app state — pin each to its stated `default` and drop the other branches entirely, don't build a settings UI that doesn't exist in the mobile app.
- Stage/pipeline color ramps (Production's 6-stage batches) are duplicated per module in its own `mock.ts` (`stageRampLight`/`stageRampDark`), not centralized in the shared theme, even when two modules intentionally share the identical ramp (Dashboard's stage widget = Production's batch stages).
- A 7-column calendar month grid uses `width: '12.5%', flexGrow: 1` per cell (safely under `100/7≈14.28%` so the row never wraps early, then `flexGrow` fills it) — same trick as `kpi-grid.tsx`'s 2-column grid.

**Theme**: always consume via `useTheme()` from `@/theme/theme-provider`, never raw hex (except the literal-hex printed-document exception above). Semantic roles: `background, surface, surfaceRaised, surfaceInverted, border, textPrimary, textSecondary, accent, accentText, accentDeep, accentWash, accentWashText, danger, dangerText, dangerWash, dangerWashText, warning, warningWash, warningWashText, draftWash, draftWashText, draftDot, onDark.{text,textMuted,accent,accentWash,accentWashText,dangerWash,dangerWashText,warningWash,warningWashText,avatarBg,avatarText}, shadows.{card,raised,sheet,floating}`. `surfaceInverted` + `onDark.*` is for the one-inverted-card-per-screen pattern.

**Money formatting**: never `Intl.NumberFormat` — match whichever glyph the specific source script itself uses. Finance/Purchases/Billing use the literal `रु` glyph (`fmt`/`lakh`/`rupees` pattern); Employees & HR/Attendance prefix literal `"NPR "` (`num`/`npr` pattern). Each module that needs money formatting gets its own tiny `utils.ts` — check the source file's own literal text before picking a style.

**Animations**: list rows use `entering={FadeInUp.delay(i*30…40).duration(200-240)}`, removal uses `exiting={FadeOutUp.duration(180-200)}` + `layout={LinearTransition.duration(200)}`. View-switch transitions (list↔detail, wizard steps) use `RiseIn` or a plain `Animated.View entering={FadeInUp.duration(200)}`.

**Known gotchas:**
- The classic `Tabs` from `expo-router` has **no** `tabBar` prop — but `Tabs` from `expo-router/js-tabs` does, and the tab shell now uses that import (`tabBar={(props) => <CustomTabBar {...props} />}` in `(app)/(tabs)/_layout.tsx`) instead of the older `layout` wrapper workaround. Only relevant if you touch the tab shell; the 5 tab routes are done.
- `.npmrc` has `legacy-peer-deps=true` — required because `expo-router`'s web-only `@expo/ui`→radix-ui chain wants a newer `react-dom` than the SDK-pinned React version. Don't remove it.
- RN's New-Architecture `boxShadow` CSS-string style works fine (`theme.shadows.card` etc.) — don't switch to `shadowColor`/`elevation`.
- `Icon`'s `name` prop is typed from Feather's real glyph set — casting an invented name `as IconName` will typecheck but render nothing at runtime.
- Feather has no dedicated bank/building icon — `home` is the closest glyph, always paired with the word "Bank" per the never-color-alone rule. It does have `check`/`flag`/`x` for tri-state pass/flag/fail controls.
- **`<Link asChild>`'s child cannot receive an array `style` prop** — expo-router clones that child via its own `Slot`, which throws ("You are passing an array of styles to a child of `<Slot>`") instead of just warning, taking down the whole screen with no error boundary. Found live in `screens/more/module-card.tsx` (the only `asChild` usage in the app) — every one of the 15 More-hub cards crashed the More tab until fixed with `style={StyleSheet.flatten([...])}` instead of `style={[...]}`. Any future `Link asChild` needs the same flatten.

**Verification loop per module**: after writing each module, run `npx tsc --noEmit` from the repo root and fix errors before moving on. Every 2-3 modules (or at a natural checkpoint), do a bundle sanity check: `npx expo start --web --port <free-port>` (background, `$env:CI="1"` so Metro doesn't hang in watch mode), wait for "Waiting on http://localhost:PORT", then curl both `/` and the real script src from that HTML (`/node_modules/expo-router/entry.bundle?...`, NOT bare `/entry.bundle?...`) — look for `Web Bundled ... (N modules)` with no errors, then stop the server.

## Remaining work

### Phase 7 (System/Comms/Admin) — done

Admin Panel, Messenger, and Changelog are all built, routed, and `npx tsc --noEmit` clean; the post-phase web-bundle check passed (1795 modules, no errors, up from 1760 at the end of Phase 6). Don't re-read or rebuild these — the built code is the source of truth. Module notes for future consistency:

- **Admin Panel** (`src/screens/admin-panel/`) is a staged-edit access-control matrix (role → 20 sections → hidden/view/edit), ported from the design's own self-contained `BASE` permission matrix and `GROUPS`/`ROLES` seed data — it diverges substantially from the reference repo's `AdminPanel.jsx` (which is about production-chain stage config, not role/section permissions), and per the established "design is the spec" convention that divergence was accepted rather than reconciled. Pending edits are local component state (`Partial<Record<SectionId, AccessLevel>>`), not a query — only the applied matrix goes through `usePermissionMatrix()`/`useApplyRoleChanges()`. The Review sheet is a bespoke `ReviewSheet` (richer header/footer than `BottomSheet`, same shape as `DirectorSheet`). A genuinely new literal (`HIDDEN_CHIP_FG`, no theme equivalent for the "hidden" chip's muted foreground) lives in `data/admin-panel/mock.ts` — everything else in the access-level chip reuses `accentWash`/`surfaceRaised`/`textSecondary` etc. directly.
- **Messenger** (`src/screens/messenger/`) is a two-pane (list ↔ thread) chat, `view` state local to the screen rather than a route param (mirrors the design's own single-component list/detail toggle). **Its pull-to-refresh dashed tap-box was ported as native `RefreshControl`** — the same deliberate simplification already in place for Dashboard (see Phase 9 below), not a pixel-for-pixel port. Messages and read-status are two separate query-boundary resources (`useMessages()`/`useReadStatus()`, both `Partial<Record<ThreadId, T>>`) since list-view previews need every thread's last message, not just the open one. The composer's attach button and the list header's search button have no handler in the source script either — both wired to a toast per the established "don't ship a dead-looking button" rule.
- **Changelog** (`src/screens/changelog/`) is read-only (no mutations, one `useReleases()` query). All three `data-props` preview knobs pinned to their stated defaults per the Phase 5/6 convention: grouping is always by release (the `Month` branch and `MONTH_NAMES` were dropped entirely, not ported), `highlightsOnly` is always off (all 11 change types always visible — the `tier: 'user'|'tech'` field that only served that filter was dropped too), detail text is always shown. The 11 change-type tag colors mostly reuse existing theme washes (`typePalette()` in `data/changelog/utils.ts`) following `StatusPill`'s own established per-scheme dot-color pattern (`theme.scheme === 'light' ? '#22A97A' : theme.accent'` for Feature, etc.) — only the six engineering-only types' dot color (`TECH_DOT`) is a genuinely new literal. The entry-detail sheet's "Open `<screen>`" button matches the source exactly: it closes the sheet and shows a toast rather than actually navigating there — real cross-module navigation from Changelog wasn't in scope, matching how every other module's mock-only "leaves the current screen" action (Billing's download/email, Messenger's compose) is toast-simulated rather than wired up.

### Phase 8 (Undesigned gap modules) — no Claude Design screen exists yet

These four pages exist in the reference app but were never carried into the Claude Design project, so there's no visual spec to build against. Before starting each one, either (a) create a matching screen in the Claude Design project first (same style guide, so it stays consistent with the 20 built/planned screens), or (b) if the user wants to skip design and build directly from the reference source, confirm that explicitly before writing UI from scratch — don't invent a design silently.

- **Order Management** — reference: `src/pages/OrderManagement.jsx`. A 7-stage kanban (Ordered → Cutting → Sewing → Printing → QC → Shipping → Delivered) with per-order customer/item/quantity/priority/status. Closest existing pattern in this app: Production's board/stage-tracker shape.
- **Content** — reference: `src/pages/Content.jsx` (+ `src/components/MarketingCalendar.jsx` is the *separate* Marketing module already built — don't conflate the two). A social-media content calendar keyed by date/platform/content-type/status (e.g. Instagram Reel, Draft). Grouped-by-date list, not a board.
- **Bug Report** — reference: `src/pages/BugReport.jsx`. A single form: title, description, severity (Low/Medium/High/Critical), optional screenshot upload (PNG/JPG/WEBP, 8MB cap), submitted-by auto-filled from the logged-in profile.
- **Fiscal Year Transactions** — reference: `src/pages/FiscalYearTransactions.jsx`. A drill-down transaction list for one fiscal year/type (Expense/Purchase/Payroll/Journal/Bank/Sales pills). **Check this against the already-built Finance module first** (`src/screens/finance/years-view.tsx` + `ledger-view.tsx`) — it may already cover this conceptually; confirm field-for-field before treating it as new work.

### Phase 9 — Polish & verification
- Reconsider the bespoke pixel-for-pixel pull-to-refresh on Dashboard (currently uses plain `RefreshControl` — a deliberate, documented simplification, not a bug).
- Final full `npx tsc --noEmit`.
- Full app run-through: `npx expo start` (Android emulator/device ideally, since gesture/animation fidelity can't be judged from the web target alone), click through every screen, confirm auth redirect both directions, confirm fonts load without a splash hang, confirm no New-Architecture console warnings.
