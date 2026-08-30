# Kazi Mobile — Frontend Gap Analysis & Functional Build Plan

_Audited 2026-08-26 against reference [jenithroy/kazi-app](https://github.com/jenithroy/kazi-app) (`master`), the current `src/` tree, and the reference app's **live Firestore** (project `kazi-manufacturing`, read-only via `key.json` — see Section 6)._

This document is the backlog for taking kazi-mobile from "20 design screens wired to mock data" to "a functional ERP". Every item is written to be handed to Claude as a build prompt. Work top-down: **Section 2 (cross-cutting)** unblocks everything else, then **Section 3 (per-module)** fills each module to parity, then **Section 4** adds the 4 modules that have no screen yet.

> Note: `BUILD_PLAN.md` (the original screen-by-screen plan) is currently deleted in the working tree — restore it from git if you want its conventions section; this file supersedes its "what's left" list.

---

## 0. How to use this document

### The build loop
This is a backlog, **not a single prompt**. Handing Claude the whole file and saying "build it" produces an unreviewable diff and compounding wrong guesses. Drive it one item at a time:

1. Pick the lowest-numbered unblocked item from **Section 5**.
2. Prompt: _"Do item N from `FRONTEND_GAP_PLAN.md`. First read the reference file it names (the `jenithroy/kazi-app` `.jsx`), the current mobile module (`src/screens/<m>/` + `src/data/<m>/`), and — if it touches data — the live schema (Section 6 / `key.json`, see below)."_
3. Claude builds it, runs `npx tsc --noEmit`, does a bundle sanity check at phase boundaries, and reports.
4. You review and commit.
5. Tick the box here (`- [ ]` → `- [x]`) and add a Progress-log row.
6. Repeat. Answer the relevant **Section 7** decision before starting a phase that depends on it.

### Inspecting the live Firebase (read-only, for context)
`key.json` at the repo root is a **Firebase Admin service-account key** for project `kazi-manufacturing` — the **reference web app's live database**. Claude may use it **read-only** to check real collection names, field shapes, and sample values before building a data-touching item, because the reference `.jsx` and the live schema sometimes disagree (Section 6 reconciles them and lists the known discrepancies).

- Mint a token from the key (service-account JWT → `https://www.googleapis.com/auth/datastore` scope → `oauth2.googleapis.com/token`) and call the Firestore REST API: `POST .../databases/(default)/documents:listCollectionIds`, then `GET .../documents/<collection>?pageSize=N`. Node's built-in `crypto` + `fetch` are enough — no dependencies. (A working script was used to produce Section 6; recreate it from that description.)
- **Read only. Never write, update, or delete.** No backend changes at all until the plan explicitly reaches that work and the user green-lights it. Planning the frontend wiring is the only task for now.
- **Security:** `key.json` is a private key. It is now in `.gitignore` — keep it there. It must **never** be committed, bundled into the app, or referenced by client code. The mobile app authenticates with the Firebase **Web SDK config** (public `apiKey`, `appId`, …), never a service account.

### Progress log
| Date | Item(s) | Status | Notes |
|---|---|---|---|
| 2026-08-30 | §2.1 · Firebase data layer — **writes** (all 14 modules) + dashboard clock-in | done (unverified against live rules) | Reverses the earlier "reads only" call per user instruction — the mobile app now **writes to the reference ERP's own collections**. New `src/lib/firestore/write.ts` — `createDocument`/`patchDocument`/`removeDocument` (`source:'kazi-mobile'` + server `createdAt`/`updatedAt`) + `liveWrite(tag, liveFn, mockFn)`: runs the Firestore write, logs `console.error` **loudly** on any failure (rules/shape/offline — NOT swallowed into a silent mock fallback), then always applies the mock write so the optimistic UI stays consistent; returns `mockFn` unchanged when `!isFirebaseConfigured`. Per module: new `src/data/<m>/firestore-write.ts` (mobile→live inverse mappers) + `api.ts` writes routed through `liveWrite` + hooks unchanged. **Wired:** attendance (`clock_ins` toggle + **`fetchClockStatus` now derived** from today's open punch via the notifications `actor`; roll-call `setMemberStatus`→`attendance`, undo re-applies prior status), tasks, customers, sales/orders (5-stage→ref stage names, `addOrderNote`→`arrayUnion`), production (`production` — only count/output edits round-trip), purchases (`finance_purchases`), marketing (`content_calendar`), quality-control (`qc_logs`; queue stays mock), billing (`invoices`/`quotations`; `addPayment`→`amountPaid` read-modify-write; challans stay mock), finance (`finance_expenses`/`journal_entries`/`bank_transactions`; VAT bills, order costs, `updateAccountOpening` stay mock), budget-requirements (`budget_requests`, `type`-split), employees-hr (`employees` — `resolveDocId` re-derives the reader's sequential-id ordering for update/delete; payroll approvals stay mock), inventory (`inventory` — no movements ledger live, so stock movements patch `openingStock` to the new level). **Snapshot-undo `restore*(previous[])`** are NOT reversed server-side (can't safely diff a full-array snapshot) — local view only; single-item undos (tasks/marketing) re-create. **Not run against live Firestore** — needs the `kazi-manufacturing` security rules to permit authenticated writes to these collections, and a real punch/edit to confirm; inverse mappers are lossy (8-stage↔5-stage, enum↔free-text) and best-effort. No per-mutation `invalidateQueries` except attendance clock — optimistic cache reconciles on the next stale refetch (60s / remount). **Dashboard:** new `src/screens/dashboard/clock-in-card.tsx` (`DashboardClockInCard`) reuses Attendance's `ClockCard`; `dashboard.tsx` renders it at the top of the scroll for non-admins (`role != null && !isAtLeast(role, 'nepal_admin')`). `tsc` clean; `expo export -p ios` OK (7.5 MB). Uncommitted. |
| 2026-08-30 | §2.1 · Write layer — security-rules + reference-contract pass | done | Fetched the **live `firestore.rules`** (service-account JWT → Firebase Rules API, read-only) and cross-checked `jenithroy/kazi-app` (`ClockInCard.jsx`, `Attendance.jsx`, `stockLedger.js`, live `stage_config`/`orders` samples). Fixes: (1) `write.ts` gains `setDocument(name,id,data,{merge})`. (2) **Attendance** now matches the web ClockInCard exactly — `clock_ins` doc carries `staffId = Auth uid` (rules require it) + `clockedInAt: serverTimestamp()`, **and** a companion `setDoc('attendance/{date}_{uid}', …, {merge:true})` (`status`/`hours:8`/`lateCut*`/`loggedBy:'GPS'`) on in, merged `{clockedOutAt, workedHours}` + `{note,hours}` on out; `fetchClockStatus` queries `clock_ins where staffId==uid && date==today`. `actor` singleton gains `uid` (set by `AuthProvider`). Roll-call `setMemberStatus` recovers the staffer's `staffId` from their `attendance` history → `setDoc('{date}_{staffId}')`. (3) **Orders** stage map → exact `stage_config` names (`sourcing`→**'Fabric Sourcing'**, `finishing`→'Stitching', …); `setOrderStage` appends `stageHistory` via `arrayUnion` + sets `status:'Completed'` on delivered; notes → **`notesList`** (not `notes`); `addOrder` writes `pricePerPcNPR`/`deliveryDate`/`colorway`. (4) **Inventory** — movements now `addDoc('stock_movements', {itemId,date,qty,direction,source,note,amountNPR,createdBy})` (mirrors `logStockMovement`); `openingStock` is left untouched (was being corrupted); `adjust` posts a compensating in/out by replaying movements. (5) **Billing** `addInvoice`/`addQuotation` kept **mock-only** — IRD docs, gap-free numbers via a `counters/billing` txn, `delete: if false`; only updates/payments/status go live. (6) **Finance** `deleteJournalEntry` → mock-only (`journal_entries` is `delete: if false`). Rules recap: `content_calendar`/`budget_requests` open to any signed-in user; `production`/`inventory`/`qc_logs`/`tasks` need nepal_staff+ or the section permission; `orders`/`customers`/`employees`/`finance_*`/`billing` need the section permission or admin; `bank_transactions` read+write admin-only. `tsc` clean; `expo export -p ios` OK (7.5 MB). Uncommitted. |
| 2026-08-30 | §3.12 · GPS clock-in — robust permission + recovery | done | `use-geo-clock-in.ts` rewritten: checks `getForegroundPermissionsAsync()` first and only prompts when `canAskAgain`; new `blocked` state (permanently denied) distinct from `denied`; `openSettings()` (`Linking.openSettings()`) returned from the hook. Fix acquisition now `getCurrentPositionAsync({accuracy:High})` raced against a 9 s timeout → `getLastKnownPositionAsync({maxAge:5m})` fallback → `error` only if both miss. `clock-card.tsx` blocked banner gains an **Open Settings** action (shown for `denied`/`blocked`) beside "Clock in anyway"; `blocked` copy added. `onOpenSettings` threaded through `MineView` (Attendance) + `DashboardClockInCard`. `geo.ts` `WORK_SITE` / `GEOFENCE_RADIUS_M` now accept `EXPO_PUBLIC_WORK_SITE_LAT`/`_LNG`/`_NAME`/`EXPO_PUBLIC_GEOFENCE_RADIUS_M` overrides (default stays the Kathmandu office). The `expo-location` plugin already sets the iOS `NSLocationWhenInUseUsageDescription` + Android `ACCESS_*_LOCATION` — a **native rebuild** (`expo prebuild --clean` / new dev/EAS build) is required for the OS prompt to appear; Expo Go works as-is. `tsc` clean; `expo export -p ios` OK. Uncommitted. |
| 2026-08-26 | Phase A · 1 (Currency) | foundation done | `src/lib/currency.ts` + `currency-context.tsx` + `<Money>` + More-screen NPR/GBP toggle (persisted). Wired through Purchases (rows/summary/detail) as the reference rollout. `npx tsc --noEmit` clean. Remaining per-module secondary-currency display deferred into items 6–9/14/17/28/29. Uncommitted. |
| 2026-08-26 | Phase A · 2 (Nepali dates) | foundation done | Added `nepali-date-converter@3.4.0` (MIT). `src/lib/nepaliDate.ts` (AD↔BS, 3 formats, Shrawan-1 fiscal year) + `<DualDate>` + `<NepaliDatePicker>` (BottomSheet, BS columns). Wired into Purchases detail as worked example. `npx tsc --noEmit` clean. Per-module rollout deferred to items 6–16/26–27/29. Uncommitted. |
| 2026-08-26 | Phase A · 3 (Auth + RBAC) | RBAC on mock | `src/auth/roles.ts` + `src/auth/permissions.ts` (`sectionVisible`/`sectionCanEdit`/`financeTabAllowed`/`NAV_BY_ROLE`/`EDIT_BY_ROLE`/`canApprove`). `mock-auth` carries `appRole` + `permissions` + `setDevRole()`. `useAuth()` → `canView`/`can`/`financeTab`/`setDevRole`. More hub + custom tab bar filter by visibility; dev Role switcher on More. `<PermissionNotice>` component; Budget manual Staff/Admin toggle removed and gated via `canApprove`/`can`. Real Firebase Auth deferred (Track B). `npx tsc --noEmit` clean. Uncommitted. |
| 2026-08-26 | Phase B · 6 (Finance Expenses + VAT Bills) | done | Finance data layer reshaped to the live `finance_expenses` shape + a mock `vat_bills` set; full CRUD hooks (update/delete/cascade/undo). New screen parts: `FinanceTabs` strip, `expenses-view`, `vat-bills-view`, `vat-bill-sheet`; add-expense sheet gains BS date picker. `<Money>` (NPR+GBP) + `<DualDate>` now live in Finance. `financeTab()` gates the two new tabs. `npx expo export -p ios` succeeds (bundle sane); `tsc` clean. Uncommitted. |
| 2026-08-26 | Phase B · 7 (shared multi-line purchases) | done | `src/data/purchases` reshaped to the shared `finance_purchases` schema (multi-line `items[]`, `EXP0NN` via `nextExpenseId`, `computeTotals`, `buildEntry`/`draftFromEntry`). New: `purchases-pane.tsx` (shared list+summary+sheets), `purchase-detail-sheet.tsx`; `add-sheet` rebuilt as a multi-line editor (party/category/payment+bank/BS date/discount/VAT/status/lines + live totals + edit + delete). Standalone Purchases screen is now a thin wrapper; Finance gets a **Purchases tab** rendering the same pane. Auto stock-in via new `useAdjustStock`/`adjustStockByName`. `<Money>`/`<DualDate>` + search + `can('purchases')` gating. `expo export -p ios` OK; `tsc` clean. Uncommitted. |
| 2026-08-26 | Phase B · 8 (Journal + Ledger + CoA) | done | `DEFAULT_ACCOUNTS` (26) + `seedJournalEntries` + `accounts`/`journal_entries` mock collections & hooks (add/update/delete/undo, editable opening balance). `data/finance/ledger.ts` — `accountLedger()` (running Cash/Bank from journal + paid purchases + paid expenses) + `accountSummaries()`. Screen: `FinanceTabs` gains **Journal** + **Ledger**; `journal-view` / `journal-sheet` (Dr≠Cr + advance-party validation) / `account-picker` / `account-ledger-view` / `opening-balance-sheet`. Old FY-ledger drill renamed `fy-transactions`. `expo export -p ios` OK; `tsc` clean. Uncommitted. |
| 2026-08-26 | Phase B · 9 (P&L + Balance Sheet + KPI + charts) | done | `data/finance/pnl.ts` — `buildProfitAndLoss` (Sales Revenue from Billing `paid`/`nprOf`, Payroll from Employees `pay()`, opex/purchases/journal-expense splits) + `buildBalanceSheet` (per-account balances, Profit-for-Year = net, Assets vs Liab+Equity check). Screen: `FinanceTabs` gains **P&L** + **Balance sheet**; `pnl-view` (statement + income/expense + outgoings + purchases-by-category bars), `balance-sheet-view`, `kpi-strip` (always above tabs, Payroll/Purchases tappable). Cross-imports Billing + Employees data. `expo export -p ios` OK; `tsc` clean. Uncommitted. |
| 2026-08-26 | Phase B · 10 (Bank tab) | done | `bank_transactions` mock collection + hooks (add/delete/undo). `bank-view` (In/Out/Net strip + colour-coded list + long-press delete) + `bank-tx-sheet` (bank picker incl. Other / BS date / Credit·Debit / category / reference). `LedgerSources` gains `bankTransactions`; the feed now moves the Ledger tab's Cash/Bank running balances. `expo export -p ios` OK; `tsc` clean. Uncommitted. |
| 2026-08-26 | Phase B · 13 (Billing challans + quotations) | done | `data/billing` extended with `Challan` / `Quotation` / `DocLine` types + seeds + `calcTotals` (discount-before-VAT) + `nextDocNumber` (gap-free `CH-0NN` / `QT-0NN`) + list/add/status/restore hooks. Screen: `DocTypeSwitch` (3-way, counts), `DocList` (status chips + rows), `DocSheet` (one shared create form — challan: vehicle/driver/route + auto fiscalYear; quotation: validUntil BS picker + terms + NPR/GBP currency), `DocDetailSheet` (read-only + status-transition buttons). Invoice tab untouched; new FAB + notices gated on `can('billing')`. Items 14–16 still own the invoice create/edit form, convert-to-invoice, CSV, real PDF, per-FY numbering. `expo export -p ios` OK (bundle 5.3 MB); `tsc` clean. Uncommitted. |
| 2026-08-26 | Phase B · 12 (Accounting) | done | Accounting is now `<Finance variant="accounting" />` — a `variant` prop on the shared Finance hub swaps header + KPI strip (`accounting-kpis.tsx`: Total income / Total expenses / Net P&L / entry count) + tab set (Journal / Ledger / P&L / Balance sheet). Old `src/data/accounting/*` (adjustments mock + invented chart) and `accounting/{ledger-view,log-entry-sheet,sheet-view}.tsx` deleted. Edit-gated on `can('accounting')`. Decision #2 → (a). `expo export -p ios` OK (bundle 5.2 MB); `tsc` clean. Uncommitted. |
| 2026-08-27 | Phase D · 28 (Employees & HR — org chart) | partial | `Employee.reportsTo?: number` + seeded hierarchy in `PEOPLE`; `EmployeeView` gains `'orgchart'`; `tabs-header.tsx` refactored to a 3-tab map; new `org-chart-view.tsx` (`flatten()` walks the reportsTo tree → indented list, inactive dimmed, report-count badge, tap → edit sheet); `index.tsx` renders it for `view === 'orgchart'`. Item 28 now only missing attendance-driven payroll auto-calc. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.4 MB). Uncommitted. |
| 2026-08-27 | Phase D · 28 (Employees & HR — salary PDF + delete) | partial | New `src/lib/pdf/salarySlip.ts` — `slipHtml(SlipData)` (SSF letterhead, employee/payment blocks, earnings/deductions tables, gross/net/words/footnote) → `Print.printToFileAsync` → `Sharing.shareAsync`; `salary-slip.tsx` Email + Download now both call `shareSlip` (real). `data/employees-hr`: `deleteEmployee`/`restoreEmployees` api + `useDeleteEmployee`/`useRestoreEmployees`. `employee-sheet.tsx` edit mode gains "Create app login" (Track B toast) + "Remove from directory" (danger) actions; `index.tsx` `shareSlip` / `handleCreateLogin` / `handleDeleteEmployee` (Undo). Status toggle already existed on the sheet. Org chart + attendance auto-calc still to do. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.4 MB). Uncommitted. |
| 2026-08-27 | Phase D · 27 (Attendance roll-call editor + report + CSV) | done | `data/attendance`: `MemberMonth` + `month` on `TeamMember` (per-staffer MTD tallies); mutable `teamDb`; `setMemberStatus` (derives `times`/`hours`) + `restoreTeam` api; `useSetMemberStatus` / `useRestoreTeam` hooks; `TODAY_LABEL`. `team-row.tsx` rebuilt with an `editable` mode (5 status chips) + `onOpenReport`; `team-view.tsx` gains an edit toggle + wires report/export; new `employee-report-sheet.tsx` (tally grid + CSV). `index.tsx`: `handleSetStatus` (undo toast), `handleToggleEdit` (change count), `handleExportRollCall` / `handleExportReport` → `toCSV` + `Clipboard.setStringAsync`. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.4 MB). Uncommitted. |
| 2026-08-27 | Phase C · 23 (Production — batch output logging) | partial | `Batch.output?: {checked, passed, failed}` + `BatchOutputDraft`; seeds b3/b5 get output. New `output-sheet.tsx` (checked/passed inputs, failed auto = checked − passed, live QC pass-rate preview). `detail-view.tsx` gains an "Output & QC" card (stat row + pass-rate bar + "Log output/Update" button); `index.tsx` `openOutput`/`handleSaveOutput` persist via `useUpdateBatch` with an auto system note. Rest of item 23 (orders sub-module / dispatch / issue-invoice / order costs) left — gated on decision #3 + item 22. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.4 MB). Uncommitted. |
| 2026-08-27 | Phase C · 24 (Quality Control → batches + qc_logs) | done | `data/quality-control`: `QueueItem` gains `batchId`; `seedQueue` now derived from `production` `seedBatches` (QC-gated stages, active/hold), sample ≈ 5% of qty. New `QcLog` type + `seedQcLogs` (4) + `fetchQcLogs`/`addQcLog`/`restoreQcLogs` + `useQcLogs`/`useAddQcLog`/`useRestoreQcLogs`; `keys.logs()`. Screen `index.tsx`: `clear(item, kind, detail?)` posts a `QcLog` on every verdict (checklist submit passes real `checkedCount`/`passedCount`/`defects`/`passRate`/`defectNotes`; quick card verdicts synthesise a rate), undo restores queue + logs; 7-day rollup (`meanPass`, `failedCount`, `flaggedCount`) drives `QueueSummary`, now prop-driven. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.4 MB). Uncommitted. |
| 2026-08-27 | Phase C · 19 (Inventory stock movements + edit) | done | `data/inventory`: `StockMovement` reshaped to a real per-item ledger (`kind` in/out/adjust, `delta`, running `balance`, `reason`, `ref`, `date`) + `StockMovementDraft` / `StockDetailsDraft`; `seedMovements` (6 rows across s1/s2/s4); `fetchMovements` / `updateStockItem` / `postStockMovement` (computes delta, updates `qty`, appends row) / `restoreInventory`; `adjustStockByName` now also logs a movement. Hooks: `useStockMovements` / `useUpdateStockItem` / `usePostStockMovement` / `useRestoreInventory`. Screen: `adjust-sheet.tsx` (In / Out / Adjust-to radio, qty + live "on hand after", reason, ref), `edit-sheet.tsx` (threshold / lead / location / cost / supplier); `detail-view.tsx` gains an Adjust-stock button, a Details/Edit header, and renders the real per-item ledger with an empty state. `index.tsx` wires both sheets under the detail branch with snapshot undo. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.4 MB). Uncommitted. |
| 2026-08-27 | Phase B · 16 (Billing real IRD PDF) | PDF done | `expo-print` + `expo-sharing` installed (`expo-sharing` plugin auto-added to `app.json`). New `src/lib/pdf/invoice.ts`: `invoiceHtml()` builds an IRD tax-invoice (seller letterhead + PAN, buyer block, line table, discount→taxable→VAT split, dual BS/AD dates via `nepaliDate`, `amountInWords()` Lakh/Crore, NPR-equiv for FX, "Copy of Original — N"); `generateInvoicePdf()` → `Print.printToFileAsync`; `shareInvoicePdf()` → `Sharing.shareAsync`. `billing/index.tsx`: `handleInvoicePdf` (reprint counter in `printCounts` state) replaces the two toast stubs on `<PdfPreview>`. Per-FY gap-free numbering NOT done — invoices carry no `fiscalYear` field; deferred to item 39 / compliance Phase 2. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.4 MB). Uncommitted. |
| 2026-08-27 | Phase B · 18 (Fiscal Year Transactions) | done | `LedgerRowType` → 6 sources (added `purchase` / `payroll` / `sales`). `data/finance/mock.ts` `LEDGER`: new-type rows across the 3 FY 2082/83 months + a fresh **FY 2081/82** 2-month block for year nav. `ledger-view.tsx` rebuilt: year-nav chevrons (`yearLabel` / `onPrevYear` / `onNextYear` / `has*`), Money-in/Money-out/Net strip (follows the type filter), tappable per-type breakdown cards (icon + count + in/out sums, toggles that filter), source label on every row; new Feather icons `shopping-cart` / `users` / `trending-up` / `chevron-left`. `finance/index.tsx`: `LEDGER_TYPES` / `TYPE_LABELS`, `presentTypes`, `ledgerBreakdown`, `moneyInSum` / `moneyOutSum` / `netSum`, `goYear(delta)` over `YEARS`; `<LedgerView>` gets the new props. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.4 MB). Uncommitted. |
| 2026-08-27 | Phase D · 26 (Attendance — GPS geofenced clock-in + late-cut) | done | `expo-location` installed (`~57.0.14`) + config plugin in `app.json` (when-in-use string). New `src/lib/geo.ts` (`WORK_SITE` / `GEOFENCE_RADIUS_M` 100 / `GPS_ACCURACY_THRESHOLD_M` 500 / `haversineDistance` / `evaluateGeofence`, ported from reference `utils/geo.js` + `constants.js`) and `src/data/attendance/schedule.ts` (`EMPLOYEE_SCHEDULES` keyed to the mock roster + `DEFAULT_SHIFT`, `calculateAttendanceStatus` — >10 min past shift start ⇒ `lateCutApplied`). `data/attendance`: `ClockPunch` (raw `clock_ins` collection) + `PunchSummary` on `ClockStatus`; `toggleClock` now takes `{elapsedSeconds, staffName, coords, bypassUsed}`, geofences the fix, grades lateness, appends a punch; `fetchClockPunches` + `useClockPunches`; `CLOCK_PUNCHES` seed + `MY_NAME`. New `use-geo-clock-in.ts` hook (permission → `getCurrentPositionAsync` → geofence eval, states idle/locating/ready/denied/error). `clock-card.tsx` shows distance/accuracy, a warn banner + "Clock in anyway" bypass when outside the fence / low accuracy / permission off, and the late-cut line while clocked in; `index.tsx` runs the acquire→verify→punch flow with late/​bypass toasts. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.5 MB). Uncommitted. |
| 2026-08-27 | §2.7 (Tasks search box) | done | `tasks/index.tsx` gains a search field (styled like the Customers/Employees one) above the filter chips — matches task title, ref, or assignee name (`PEOPLE` lookup); folded into `matchesFilters` so the chip counts and empty state follow the query. `npx tsc --noEmit` clean. Uncommitted. |
| 2026-08-27 | Phase D · §3.12 leftovers (Attendance weekly chart + BS calendar) | done | Closes the two remaining §3.12 boxes (not tied to a Section-5 item; 26/27 covered the rest). New `weekly-hours.tsx` — per-week hours bars vs a target tick, met/under coloured (`theme.accent` / `theme.warning`) — on the "Mine" view, fed by a new `WEEKLY_HOURS` seed. `month-calendar.tsx` header gains a Bikram Sambat span sub-label (`bsFromAD` + `BS_MONTHS_EN` over new `MONTH_ISO_START`/`MONTH_ISO_END` consts). `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.5 MB). Uncommitted. |
| 2026-08-27 | Phase E · 35 (Customers — real join data) | done | New `src/data/customers/joins.ts` — `ordersForCustomer(salesOrders, name)` (open Sales orders, 'delivered' → 'packing' chip) + `invoicesForCustomer(billingInvoices, name)` (matched on `CLIENTS[client].name` / `clientName`, GBP-normalised — GBP invoices as-is, others via booked NPR rate ÷ `GBP_RATE`; status from `statusFull`, `Cancelled` dropped). `customers/index.tsx` pulls `useOrders` + `useInvoices` and builds a `detailCustomer` from the join for `<DetailView>`, keeping each seed's own `orders[]`/`invoices[]` as the fallback when there's no name match. Directors module has no joinable data — static reference content, left as-is. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.5 MB). Uncommitted. |
| 2026-08-27 | Phase D · 28 (Employees & HR — attendance-driven payroll auto-calc) | done | Finishes item 28. New `src/data/employees-hr/attendance-sync.ts` — `attendancePrefill(team, employee)` name-matches the Attendance roster (`useTeamRoster`) and derives `absent` / `late` / `otH` from its `MemberMonth` (`otHours` "9h 20m" → 9). `payroll-view.tsx` gains an `onSyncAttendance?` dashed action ("Sync absent · late · OT from attendance") in the run card, shown only while `runOpen`; `index.tsx` `syncFromAttendance()` `updateEmployee`s every matched record whose figures differ, then `pay()` recomputes the attendance cut — toast reports the change count with Undo (`restoreEmployees`). Directory search box was already implemented (`directory-view.tsx`) — §3.11 box ticked. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.5 MB). Uncommitted. |
| 2026-08-27 | Phase B · 17 follow-up (Budget Requirements-tab parity) | done | `Requirement` gains `quantity` (free text) + `amountGBP`; `Category` swapped to reference `REQ_CATEGORIES` (`Raw Materials / Tools / Machinery / Office Supplies / Safety Equipment / Other`) — `CATEGORY` colour map + `CATEGORY_ICON` (`package`/`tool`/`settings`/`file-text`/`shield`/`grid`) + all 8 seeds remapped. `add-sheet.tsx`: Quantity `TextField` + dual रु/£ cost rows (`handleAmount` keeps both synced at `GBP_RATE`, "auto" tag on the derived side). `requirement-group.tsx` + `detail-view.tsx` render amount via `<Money>` (NPR+GBP), show quantity (+ a Quantity fact card). `index.tsx` `emptyDraft`/`handleSubmit` updated. `npx tsc --noEmit` clean. Uncommitted. |
| 2026-08-27 | Phase B · 17 (Budget Requests tab) | done | New `budget_requests` mock collection: `BudgetRequest`/`BudgetRequestDraft`/`ReviewStatus`/`BudgetCategory` types, 6 seeds, `BUDGET_CATEGORIES`/`BUDGET_CATEGORY`/`REVIEW_STATUS`, `fetch/add/update/restore` api + `useBudgetRequests`/`useAddBudgetRequest`/`useUpdateBudgetRequest`/`useRestoreBudgetRequests`, `gbp()` util. Screen: `budget-tabs.tsx` (Budget Requests ↔ Requirements, per-tab pending badge), `request-sheet.tsx` (GBP amount + live ×`GBP_RATE` NPR, category chips, urgency, required justification, `BR-00NN`), `request-group.tsx` (GBP primary / NPR muted, Pending+Decided buckets), `request-detail-view.tsx` (facts grid + justification + Approve/Reject → `reviewedBy`), `review-filters.tsx` (status chips w/ counts + urgency pills, shared). `index.tsx` rebuilt as a 2-tab hub; Requests approval gated on `canApprove(profile)`, both FABs on `can('budget-requirements')`. Requirements-tab NPR↔GBP dual entry + free-text qty + reference category set left as a follow-up. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.3 MB). Uncommitted. |
| 2026-08-27 | Phase B · 15 (Billing convert / CSV / search / deep-link) | done | `invoice-sheet.tsx`: `draftFromInvoice` (extracted, reused by Edit + deep-link) + `draftFromQuotation` (GBP→NPR at `RATES.GBP`, VAT on, Net 30). `DocDetailSheet` gains an `onConvert` "Convert to invoice" button for un-billed quotations; `index.tsx` `handleConvertQuotation` opens the prefilled sheet and `handleSaveInvoice` stamps `relatedQuotation` + `updateQuotation({status:'Accepted', relatedInvoice})` (new `useUpdateQuotation` hook + `updateQuotation` mock-api). New `src/lib/export/csv.ts` (`toCSV`, no deps) + header download button → CSV of the current filter/search to clipboard via `expo-clipboard` (installed). Invoice-list search `TextField` (client / ref / SO / status). `src/app/(app)/billing.tsx` reads `focus`+`autoEdit`; `Billing({focus,autoEdit})` mount effect opens detail (+ edit sheet). `npx tsc --noEmit` clean. Uncommitted. |
| 2026-08-27 | Phase B · 14 (Billing create/edit invoice) | done | New `invoice-sheet.tsx` — full invoice editor (client block + PAN/phone/address, NPR/GBP, BS issue+due pickers, multi-line items w/ unit chips + live amounts, 13% VAT toggle, discount %/flat, Cash/Bank/Credit routing, Draft/Sent, notes, live `calcTotals` card). `index.tsx`: `openNewInvoice` / `openEditInvoice` / `handleSaveInvoice` (add vs `updateInvoice` on `draft.id`) / `handleCancelInvoice` (cancel + `cancelNote` + Undo). `utils.ts`: `InvoiceStatusFull` 6-state + `statusFull()` (Draft/Sent user-set, Partial/Paid/Overdue derived) + `INVOICE_PILL`; `appliesVAT`/`taxable`/`discountAmt` helpers. Payment ceiling enforced in `handleSavePayment`. PAN required > NPR 50,000 (sheet note + disabled save + save-time re-check). `invoice-row.tsx` + `detail-view.tsx` moved onto `statusFull`/`INVOICE_PILL`; detail gains Bill-to card, discount/taxable rows, and `can('billing')`-gated Edit + Cancel actions. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.3 MB). Uncommitted. |
| 2026-08-26 | Phase B · 11 (Order P&L tab) | done | `data/finance/order-pnl.ts` — `autoLabourRate` (last-month production-dept payroll ÷ seeded `LAST_MONTH_UNITS_PASSED`), `buildOrderPnl` (per-order revenue vs material/labour/overhead/shipping, auto-labour for cost-less orders), `summariseOrderPnl`. New `order_costs` mock collection + `useOrderCosts`/`useUpsertOrderCosts`/`useDeleteOrderCosts`/`useUndoOrderCosts` (keyed by order id, seeded 3 orders: healthy/thin/loss). Screen: `FinanceTabs` gains **Order P&L**; `order-pnl-view` (in-tab KPI strip, ⚡ auto-labour banner, All/Active/Delivered filter, margin pills 20/0), `order-costs-sheet` (4 NPR fields + live profit/margin preview + Clear costs). Consumes Sales `useOrders` + Employees `pay()`. `<Money>` NPR+GBP. `financeTab('order-pnl')` gating. Date-range filter deferred (Order model has no date). `expo export -p ios` OK; `tsc` clean. Uncommitted. |
| 2026-08-30 | §5.0 · 22 (Order Management) | done | Decision #3 → §7 recommendation. `src/data/sales/` extended to own `orders` CRUD: `Order` + `priority`/`status`/`assignedTo`/`stageHistory`/`notes`, `OrderDraft`, `nextOrderRef`, `STAGE_IDS`; `add`/`setOrderStage`/`setOrderPriority`/`addOrderNote`/`setOrderStatus` mock-api + hooks (optimistic + snapshot undo). New `src/screens/order-management/` — `index` (Board↔List), `board-column`/`order-card` (per-card ‹ › stage move), `order-list-row`, `order-sheet` (create/edit), `detail-sheet` (facts + stage stepper + history timeline + notes + priority + cancel/restore). RBAC `order-management` section (SectionId/ALL_SECTIONS/NAV nepal_admin+staff/EDIT nepal_staff) + `(app)/order-management.tsx` + `_layout` + `MORE_MODULES` card. FAB + notice gated on `can()`. DnD deferred (move buttons, matches Production). `tsc` clean; `expo export -p ios` OK (5.6 MB). Uncommitted. |
| 2026-08-30 | §5.0 · Track B prep (safe subset) | done | `firebase@^12.18.0` installed (`npx expo install`); `src/lib/firebase.ts` = inert lazy scaffold (`isFirebaseConfigured` / `getFirebaseApp` / `getDb` w/ persistent→memory cache fallback / `getFirebaseAuth`, all throw until `EXPO_PUBLIC_FIREBASE_*` set; nothing imports it → not bundled). `src/lib/firestore/normalise.ts` = pure read-coercion helpers (`parseMaybeJson` / `num` / `bool` / `str` / `arr` / `tsToISO` / `dedupeByName`). `scripts/inspect-firestore.mjs` = dependency-free read-only Firestore inspector (JWT from `key.json` → `listCollectionIds` + sampled GETs); re-confirmed §6 (30 collections). `tsc` clean; `expo export -p ios` OK (5.5 MB, unchanged hash). The bigger Track B items (per-module `mock-api.ts` __DEV__ bodies, type/seed regen) left — need review between modules. Uncommitted. |
| 2026-08-30 | §5.0 · §2.7 sweep + CSV leftovers | done | **§2.7:** `can(section)` gating + `<PermissionNotice>` added to Tasks / Inventory / Marketing / Production / Quality-Control / Customers / Employees-HR / Messenger / Admin-Panel / Attendance (Budget/Finance/Purchases/Billing/Bug-Report already had it). `CustomerRow`/`DetailView` (customers) + `DetailView` (inventory) + `ThreadListView` (messenger) got optional-handler props so view-only users lose the affordance cleanly. Edit-affordance audit: no screen was create-only. **CSV:** Finance FY-transactions drill → header download button → `toCSV` to clipboard; Employees-HR `exportBankFile` → real payroll CSV. `FinanceHeader` gains `rightSlot`. `tsc` clean; `expo export -p ios` OK (5.5 MB). Uncommitted. |
| 2026-08-30 | §5.0 · 34 (Changelog — GitHub commits feed) | done | `src/data/changelog` reshaped to a live feed: `parse.ts` (conventional-commit prefix → type/scope/subject, `groupByDay`, `typePalette` ported), `api.ts` (`fetchCommitFeed` — 3×100 pages off `repos/crrishav/kazi-mobile/commits`, AsyncStorage cache, offline → `stale` cache fallback), `useCommitFeed`. `mock.ts`/`utils.ts`/`mock-api.ts` deleted. Screen: `index.tsx` + `RefreshControl` + loading/error/offline states; new `day-group` / `commit-summary-card` (Live/Offline chip) / `commit-detail-sheet` ("View on GitHub" `Linking.openURL`). `tsc` clean; `expo export -p ios` OK (5.5 MB). Uncommitted. |
| 2026-08-30 | §5.0 · 33 (Bug Report module) | done | Net-new `src/data/bug-reports/` (5 files: `BugReport`/`BugReportDraft`, severity low→critical, status open→in-progress→resolved→closed, `NEXT_STATUS` chain, `BUG_AREAS`, `nextBugRef`, 6 seeds; `add`/`updateStatus`/`restore` + hooks w/ snapshot undo) + `src/screens/bug-reports/` (index + `report-row` + `filter-bar` + `report-sheet` + `detail-sheet`). RBAC: `'bug-report'` section added to `SectionId`/`ALL_SECTIONS`/`NAV_BY_ROLE` (all 5 roles)/`EDIT_BY_ROLE` (staff+employee). Route `(app)/bug-report.tsx` + `_layout` + `MORE_MODULES` card (`alert-triangle`). FAB + `PermissionNotice` gated on `can('bug-report')`. `tsc` clean; `expo export -p ios` OK (5.5 MB). Uncommitted. |
| 2026-08-30 | §5.0 · 25 (Sales — pipeline overview) | done | Sales screen rebuilt read-only: `summary.tsx` = 4 `KpiCard`s (pipeline value / active / completed / delivered this month), new `stage-breakdown.tsx` (proportion bar + per-stage count·pcs rows off `STAGES`), new `top-customers.tsx` (top 5 by booked value, mini bars). CRUD files `detail-view`/`order-row`/`filter-chips` + `STAGE_NOTE` deleted (git = item 22 seed); data layer untouched. `tsc` clean; `expo export -p ios` OK (5.5 MB). Uncommitted. |
| 2026-08-30 | Live Firestore re-inspection (read-only) | done | Re-sampled all **30** collections via a service-account JWT + Firestore REST API (no writes). New vs Section 6: `accounts` now **114 docs** (user/dupe-created, still no `openingBalanceNPR`); `counters/billing` = `{nextInvoice:50, nextQuotation:26}`; `invoices.items` / `orders.stageHistory` / `orders.notesList` came back as **native arrays** with `rate`/`qty` as **strings** (both guards still needed); `production` (2) / `qc_logs` (4) / `messages` (1) / `content` (2) / `finance_payroll` (3) barely populated live; `users.permissions` overrides + `nepal_staff`/`uk_admin`/`employee`/`nepal_admin` roles confirmed; `finance_purchases` payroll field is `lateCutsCount` (not `lateCutsNumber`). Added §5.0 solo-executable backlog. |
| 2026-08-30 | §2.6 · In-app notifications (bell + Firestore feed + routing) | done | Net-new `src/data/notifications/` — `routing.ts` (pure `recipientsFor(event, roster, actor)` + `RULES` encoding the full event→recipient matrix: predicates `ROLE`/`VIEW`/`EDIT`/`APPROVER`/`ID`/`MANAGER_OF`/`IN_LIST`/`LOC`; post-filters drop the actor, enforce `sectionVisible` except mentions/messages, dedupe, `action`>`mention`>`info`), `events.ts` (per-type title/body + section→route deep link), `roster.ts` (`employees` read + `TEAM_MEMBERS` merge, `useRecipientRoster`), `firestore.ts` (**writes only `mobile_notifications`**, equality-only query so no composite index, snapshot→one-shot fallback, `markRead`), `notify.ts` (fire-and-forget, no-op if `!isFirebaseConfigured`), `actor.ts` (module singleton set by `AuthProvider`), `context.tsx` (`NotificationsProvider` — one shared snapshot; `useNotifications`/`useUnreadCount`). New Notifications screen (`src/screens/notifications/` — `index` + `notification-row` (section icon, unread dot, long-press "why") + `filter-chips` All/Unread/For you/Mentions), route `(app)/notifications.tsx`. Dashboard bell → `/notifications` with a live unread badge (`useUnreadCount`, replaces the `unreadNotifications` mock). More hub gains `NotificationsCard`. `notify(...)` wired into 17 modules' `hooks.ts` (tasks/marketing/sales-orders/quality-control/billing/purchases/finance/inventory/production/budget-requirements/employees-hr/attendance/admin-panel/bug-reports/messenger/approvals) — role/section-routed events fan out now; identity-routed ones light up as the mock rosters reconcile with real users. **Zero writes to any existing ERP collection** (verified by grep); every doc carries `source:'kazi-mobile'`. Needs a `match /mobile_notifications/{id}` rules block (snippet in the handoff) — until then the feature no-ops silently. Client-side scheduler for `*.overdue` / low-stock-on-open left out (mock `task.due` isn't a real date); low-stock fires on stock movement. `tsc` clean; `expo export -p ios` OK (7.3 MB). Uncommitted. |
| 2026-08-30 | §2.1 / Phase A · 4 (Firebase data layer — **reads only**) | partial | User re-supplied the Web SDK config as git-ignored `webconfig.json` → recreated `.env` (`EXPO_PUBLIC_FIREBASE_*`); added `webconfig.json` to `.gitignore`. New per-module read-only swap pattern: `src/data/<m>/firestore.ts` (live readers, live doc → mock type via `src/lib/firestore/normalise.ts` coercers) + `src/data/<m>/api.ts` (selector — `fetch*` = `isFirebaseConfigured ? withMockFallback(live, mock) : mock`; **all writes stay on `mock-api.ts`**, no Firestore writes per user instruction) + `hooks.ts` import repointed `./mock-api`→`./api`. New shared `src/lib/firestore/read.ts` (`readCollection` / `readCollectionWhere` / `withMockFallback`). **13 modules wired:** tasks, customers, sales(`orders`), purchases(`finance_purchases`), production, marketing(`content_calendar`), budget-requirements(`budget_requests`, `type`-split), finance(`finance_expenses`/`accounts` w/ `dedupeByName`/`journal_entries`/`bank_transactions`; VAT-bills + order-costs stay mock), billing(`invoices`/`quotations`; challans stay mock; `payments[]` synth from `amountPaid`), employees-hr(`employees`, doc-id→sequential-numeric-id map for `reportsTo`), attendance(`attendance` aggregated → `TeamMember` MTD tallies + `clock_ins`; `fetchClockStatus` stays mock), inventory(`inventory` w/ `qty=openingStock`; `fabrics`+`processes`+`patterns`→Library; movements→`[]`), quality-control(`qc_logs`; queue stays mock). **Stay on mock (no live collection / bespoke):** dashboard, admin-panel, approvals, messenger, bug-reports, directors. All mappers validated against freshly-sampled live docs; `npx tsc --noEmit` clean; `npx expo export -p ios` OK (7.4 MB). Open Qs for user: marketing Shoot/Publish chip labels; attendance OT/tint derived defaults; inventory "from opening balance" caption; base64 image fields (`fabrics.swatchImageUrl`, `patterns.tech_pack_url`) still transfer on read (no `select()` in the Web SDK). Uncommitted. |
| 2026-08-30 | §2.1 / §2.2 · Real Firebase Auth + Account screen | done | User supplied the `kazi-manufacturing` Web SDK config → `.env` (`EXPO_PUBLIC_FIREBASE_*`, git-ignored; `websdk.json` too), so `isFirebaseConfigured` is now **true** and the firebase SDK is bundled (iOS 5.6→7.2 MB). `src/lib/firebase.ts` `getFirebaseAuth()` now `initializeAuth` with RN AsyncStorage persistence pulled from `@firebase/auth` via guarded `require` (the `firebase/auth` umbrella has no `react-native` export condition in v12), `getAuth` fallback. New `src/auth/firebase-auth.ts` — `signIn`/`requestPasswordReset`/`signOut` + `subscribe` (`onAuthStateChanged`) + `resolveProfile` (ports reference `AuthContext.jsx` chain: `employees` by email → `TEAM_MEMBERS` → `users/{uid}`, every Firestore call try/caught, best-effort `users/{uid}` self-heal, `admin@kazi.com`→`super_admin` failsafe). New `src/auth/team-members.ts` (9 rows). `Session`/`Profile` gain `uid`/`location`/`status`/`createdAt`; `auth-context` picks `firebaseAuth` vs `mockAuth` on `isFirebaseConfigured`, subscribes instead of one-shot. `RootNavigator` blocks `status:"Inactive"` with `<AccountInactive>`. New **Account screen** (`src/screens/account/` — `index` + `identity-card` + `access-summary` (live `canView`/`can`/`financeTab` over `ALL_SECTIONS`+`FINANCE_TABS`) + `session-actions` (change-password → reset email, sign out, report-a-bug, app version) + `account-inactive`), route `(app)/account.tsx`, built to `src/theme` tokens (no Claude Design proto). Dashboard header avatar is now a `Pressable` → `/account` and shows the **real** resolved profile (name/initials/role), not the `Sita`/`SR` mock. More hub gains an `AccountCard`; dev `RoleSwitcher` hidden when Firebase is configured. `use-login-flow` drops the dev email fallback + maps `auth/*` error codes. No in-app profile editing (reference parity). `expo-secure-store` still deferred — SDK persists to AsyncStorage. `tsc` clean; `expo export -p ios` OK (7.2 MB). Uncommitted. |

---

## 1. Where the app is today

| Layer | State |
|---|---|
| **Screens** | 20 modules built to the Claude Design prototypes: Login, Dashboard, Tasks, Inventory, Finance, Production, Purchases, Quality Control, Budget & Requirements, Sales, Customers, Marketing, Billing, Accounting, Employees & HR, Attendance, Directors, Admin Panel, Messenger, Changelog. Each is a design-driven **reimagining**, not a port — every one covers only the "hero" flow of its reference counterpart. |
| **Navigation** | 5 tabs (Dashboard / Tasks / Inventory / Finance / More) + 15 More-hub modules pushed on the `(app)` stack. |
| **Data** | 100% mock. Per-module `src/data/<m>/` = `types.ts` + `mock.ts` + `keys.ts` + `mock-api.ts` (in-memory `let db`) + `hooks.ts` (React Query). No network. |
| **Auth** | `src/auth/mock-auth.ts` — email/password accepted as-is, session in AsyncStorage, name/initials derived from the email local-part, role hardcoded to `'Floor supervisor · Line 3'`. |
| **Roles / permissions** | None. Every screen shows everything. Budget & Requirements and Employees & HR have a **manual in-screen role toggle** standing in for real RBAC. |
| **Currency** | NPR only, formatted with a literal `रु` / `"NPR "` glyph per module. No GBP conversion, no FX. |
| **Dates** | Gregorian only. Fiscal-year labels are static strings. No Bikram Sambat. |
| **Documents** | Billing's "PDF preview" is a styled RN view; "download"/"email" fire a toast. No real PDF, no CSV export, no share sheet. |
| **Native** | None wired. Attendance clock-in is a local `setInterval`; no GPS. QC/Production/Budget "attach photo" is a boolean flag. No push notifications. |

**Implication:** "make it functional" splits into two tracks that can run in parallel:
- **Track A — mock completeness:** add the missing screens/flows/fields on top of the existing mock layer. Fast, no infra, keeps the design-driven architecture. Most of Section 3 is this.
- **Track B — real backend:** swap the mock-api modules + mock-auth for Firebase, add RBAC, native capability, and document generation. Section 2.

Do Track A per module regardless — a real backend behind a screen that's missing half its actions is still half an ERP.

---

## 2. Cross-cutting work (unblocks every module)

### 2.1 Real backend — Firebase

The reference app is React + **Firebase (Firestore + Auth + Storage)** + a Cloudflare Worker for bank webhooks. The mock layer was deliberately built as a swap-in boundary (`mock-api.ts` per module, `mock-auth.ts`).

- [x] Add `firebase` SDK; `src/lib/firebase.ts` init from `app.config` / EAS env (`EXPO_PUBLIC_FIREBASE_*`). **Done 2026-08-30** — `firebase@^12.18.0` installed; `src/lib/firebase.ts` scaffold (`isFirebaseConfigured` + `getDb`/`getFirebaseAuth`). **Config supplied 2026-08-30** — the `kazi-manufacturing` Web SDK config (public keys, from `websdk.json`) is now in a git-ignored `.env` as `EXPO_PUBLIC_FIREBASE_*`, so `isFirebaseConfigured` is true and Auth is live. `getFirebaseAuth()` uses `initializeAuth` + AsyncStorage RN persistence. (The `key.json` service-account key is still read-only schema inspection only — never shipped; see Section 0.)
- [ ] Replace each `src/data/<m>/mock-api.ts` body with Firestore reads/writes against the collections in **Section 6**, keeping the exported function signatures identical so `hooks.ts` and screens don't change.
- [ ] Keep `simulateLatency()` only in a `__DEV__` mock fallback; real calls drop it.
- [ ] Firestore offline persistence on (RN: `initializeFirestore(app, { localCache: persistentLocalCache() })`) — covers the "offline handling" the `expo-data-fetching` skill calls for.
- [ ] Port `firestore.rules` intent into the app's optimistic-update assumptions (writes that rules would reject should surface as an error toast + rollback, which the hooks' `onError` already does).
- [ ] Real-time: the reference Dashboard/Finance use `onSnapshot`. Decide per screen whether to use `onSnapshot` (via a React Query `queryFn` that subscribes) or stick with refetch-on-focus. Dashboard and Messenger want live; the rest can poll.

### 2.2 Auth + Role-Based Access Control

Reference model (`src/context/AuthContext.jsx`, `src/utils/permissions.js`, `PERMISSIONS.md`):

- 5 roles: `super_admin`, `uk_admin`, `nepal_admin`, `nepal_staff`, `employee`.
- Profile resolved from Firebase Auth → `employees` collection (by email) → `TEAM_MEMBERS` fallback → `users/{uid}` doc.
- Per-user permission **overrides** stored on `users/{uid}.permissions` (a `{ section: bool | {finance sub-tabs} }` object) that beat the role default.
- `sectionVisible(profile, key)` — nav filtering. `sectionCanEdit(profile, section)` — write gating. `financeTabAllowed(profile, tabKey)` — the 10 Finance sub-tabs gated individually.

Build:
- [x] `src/auth/` → real Firebase Auth (`signInWithEmailAndPassword`, `sendPasswordResetEmail`, `onAuthStateChanged`). **Done 2026-08-30** — `src/auth/firebase-auth.ts` (`subscribe` = `onAuthStateChanged` + `resolveProfile`; `signIn`/`requestPasswordReset`/`signOut`). `resolveProfile` ports the reference chain (`employees` by email → `TEAM_MEMBERS` (`src/auth/team-members.ts`) → `users/{uid}`), every Firestore call try/caught, best-effort `users/{uid}` self-heal, `admin@kazi.com`→`super_admin` failsafe, `status:"Inactive"`→blocked (`<AccountInactive>` in `RootNavigator`). `auth-context` switches impl on `isFirebaseConfigured` (mock otherwise) and subscribes instead of one-shot. Session persists via the SDK's AsyncStorage store — **`expo-secure-store` deferred** (not yet a dep). Account screen surfaces the resolved profile; `use-login-flow` requires real credentials + maps `auth/*` errors.
- [x] `src/auth/permissions.ts` — `sectionVisible` / `sectionCanEdit` / `financeTabAllowed` + `DEFAULT_NEPAL_ADMIN_PERMISSIONS` + `NAV_BY_ROLE` + `EDIT_BY_ROLE` + `canApprove`. `src/auth/roles.ts` has the 5 roles + `ROLE_RANK` / `isAtLeast`. _(2026-08-26)_
- [x] `useAuth()` exposes `{ profile, role, canView(section), can(section), financeTab(key), setDevRole }`. _(2026-08-26)_
- [x] More-hub (`src/screens/more`) and the custom tab bar filter by `sectionVisible` (tab bar filters `state.routes`; `more` always shown). Dev **Role switcher** added to the More screen. _(2026-08-26)_
- [~] Every screen's create/edit/delete affordance gated by `can(section)`; read-only users see `<PermissionNotice section=…>`. **Mechanism + Budget wired** (FAB gated, notice shown); the remaining per-screen wiring is each module's §2.7 pass.
- [~] Remove the manual role toggles — **Budget & Requirements done** (Staff/Admin segment removed; `isAdmin` now = `canApprove(profile)`, FAB = `can('budget-requirements')`). Employees & HR has no viewer toggle in the mobile build; its payroll-approve gate lands with item 28.
- [ ] Dashboard becomes role-adaptive (see 3.13 / item 29).
- [ ] Bottom navigation becomes role-composed, with Messenger as a permanent tab (see 2.9 / item 5b — needs decision #9).

### 2.3 Currency — dual NPR / GBP + FX

Reference: `GBP_RATE = 200` constant (`src/constants.js`), `CurrencyContext` with an `fmt()` that renders the user's preferred currency, `asCurrency(v, "NPR"|"GBP")`. Billing also has a live-FX popover hitting `exchangerate-api.com` for 10 currencies with a manual-override field.

Build:
- [x] `src/lib/currency.ts` — `GBP_RATE`, `toGBP`, `toNPR`, `convert`, `asCurrency`, `asCompactCurrency`, `moneyParts`. _(2026-08-26)_
- [x] `CurrencyProvider` (`src/lib/currency-context.tsx`) + `useCurrency()` (`primary`/`secondary`/`format`/`parts`), persisted to AsyncStorage; NPR/GBP toggle on the More screen (`src/screens/more/currency-toggle.tsx`); `<Money npr={…} />` display component (`src/components/ui/money.tsx`). _(2026-08-26)_
- [~] Every money value shows the secondary currency in muted text. **Purchases done** (worked example: rows, list summary, detail). Finance/Billing/Budget/Employees/Dashboard/Directors rollout is folded into each module's own phase item (items 6–9, 14, 17, 28, 29) since those rebuild the same screens — swap their leaf money `<Text>` for `<Money>` there.
- [ ] Billing multi-currency invoices: `Invoice.cur` already exists (`GBP | EUR | NPR`) — add a live-rate fetch + manual override for the invoice/quotation line-item rate, and GBP→NPR conversion on "convert quotation to invoice". _(with item 14/15)_

### 2.4 Bikram Sambat dates + Nepali fiscal year

Per `NEPAL_COMPLIANCE_PLAN.md` (Phase 1) and reference `src/utils/fiscalYear.js` + `src/components/DualDateInput.jsx`.

- [x] `src/lib/nepaliDate.ts` — `nepali-date-converter@3.4.0` (MIT). `bsFromAD`/`bsToAD`, `formatBS` (`numeric` / `long` / `devanagari`), `formatAD`, and `fiscalYearForAD` / `currentFiscalYear` / `recentFiscalYears` / `isInFiscalYear` off the Shrawan-1 boundary. _(2026-08-26)_
- [x] `<DualDate iso={…} />` (`src/components/ui/dual-date.tsx`, BS primary / AD secondary) + `<NepaliDatePicker>` (`src/components/ui/nepali-date-picker.tsx`, BS year/month/day columns in a BottomSheet, emits AD ISO). _(2026-08-26)_
- [~] Store both `date` (AD ISO) and `dateBS` on new/edited docs — not needed for display (BS is derived from the ISO via the lib); revisit per-module only if a screen must filter/sort by BS directly.
- [~] Roll out to Billing → Finance → Attendance → Dashboard. **Purchases done** (detail-view date line) as the worked example; the named screens get it in their own phase items (13–16, 6–11, 26–27, 29).
- [ ] Finance's `YEARS` list and the fiscal-year ledger become real derivations — use `recentFiscalYears()` / `isInFiscalYear()` (with items 8 & 18).

### 2.5 Document generation — PDF / CSV / share

Reference: `InvoicePDF.jsx` (`@react-pdf/renderer`, IRD tax-invoice layout), `SalarySlipModal.jsx`, `DocPreview.jsx`, plus CSV export in Billing.

- [~] `expo-print` (HTML string → PDF) + `expo-sharing` **added (item 16)**; `expo-file-system` not needed yet (`printToFileAsync` returns a uri, `shareAsync` takes it directly).
- [x] `src/lib/pdf/invoice.ts` (item 16) — IRD-format tax invoice: seller PAN + letterhead, buyer name/PAN/phone/address, line table, **taxable value vs VAT split**, discount-before-VAT, **amount in words** (Lakh/Crore), dual BS/AD issue+due dates + fiscal year, NPR-equivalent for FX invoices, "Copy of Original — N" reprint counter. Billing's `PdfPreview` actions now generate + share for real. _(2026-08-27)_
- [x] `src/lib/pdf/salarySlip.ts` (item 28) — `expo-print` HTML→PDF of the SSF-letterhead slip + `expo-sharing`; wired into `salary-slip.tsx`'s Email/Download actions. _(2026-08-27)_
- [x] CSV — `src/lib/export/csv.ts` (`toCSV`, no deps). Wired: Billing list export (item 15), Attendance roll-call + employee report (item 27), Finance FY-transactions ledger + Employees-HR payroll transfer file (2026-08-30). All copy to the clipboard.
- [~] `src/lib/export/csv.ts` — Billing / Finance ledger / Attendance / payroll all wired. A true file write + `expo-sharing` `.csv` share sheet (instead of clipboard) is deferred to item 5.
- [~] Wire every toast-simulated "download / email / share / export" to a real share sheet. Salary-slip + invoice PDFs use `expo-sharing`; all CSV exports use the clipboard for now (item 5 upgrades these to a share sheet).

### 2.6 Native capability

| Capability | Reference | Mobile target |
|---|---|---|
| **GPS geofenced clock-in** ✅ item 26 | `ClockInCard.jsx` + `src/utils/geo.js` (Haversine), `WORK_SITE` lat/lng, `GEOFENCE_RADIUS_M = 100`, `GPS_ACCURACY_THRESHOLD_M = 500` | **Done** — `expo-location` + `src/lib/geo.ts` (position, reject `accuracy > 500 m`, distance to `WORK_SITE`, block outside 100 m + bypass, show distance) + `src/data/attendance/schedule.ts` late-cut from `EMPLOYEE_SCHEDULES`. |
| **Photo attachments** | `expo`-less `<input type=file>` + Firebase Storage in Production notes, QC evidence, Budget quotes, Inventory tech packs, Finance/Purchases VAT bills, Bug Report | `expo-image-picker` + resize (`expo-image-manipulator`) + upload to Firebase Storage, store `{url, path}`. Replace every boolean "attached" flag with a real thumbnail + viewer. |
| **Push notifications** | `src/utils/native.js` `initPushNotifications` → FCM token on `users/{uid}.fcmToken` | `expo-notifications` + FCM; register token on login; handle task-assigned / budget-decided / message-received / order-dispatched. |
| **Deep links** | React Router `location.state` hops (Finance ledger → Purchases/Billing, Finance KPI → Employees payroll) | `expo-router` params — e.g. `/purchases?focus=EXP027`, `/billing?focus=INV-1043&autoEdit=1`. |

### 2.7 Universal per-screen gaps

Apply to **every** module during its Section 3 pass:

- [x] **Edit** — audited 2026-08-30: no screen was actually create-only. Every mutating module already has an edit path (Tasks `TaskEditSheet`, Inventory `EditSheet`, Marketing/Production/Budget/Billing/Customers/Employees sheets). Sales is now read-only (item 25).
- [~] **Search** — reference has a search box on Billing, Purchases, Customers, Tasks, Employees, Messenger, Fiscal-Year Transactions. Mobile now has it on Inventory, Customers, Billing (item 15), Purchases (item 7), Employees, and **Tasks** (2026-08-27 — title / ref / assignee). Still missing on Messenger (waits on item 31 backend) and the Fiscal-Year Transactions drill (low value on mock data).
- [ ] **Loading / empty / error** — mobile has spinner + `EmptyState`; add an inline error banner with retry (reference `showError` pattern) for failed mutations once real network is in.
- [x] **Permission notices** — read-only banner when `!can(section)`. Wired across every mutating module (2026-08-30): Budget/Finance/Purchases/Billing/Bug-Report already had it; Tasks/Inventory/Marketing/Production/Quality-Control/Customers/Employees-HR/Messenger/Admin-Panel/Attendance added. Each also gates its FAB / create+edit+delete affordances on `can(section)`.
- [ ] **Undo** — keep the established snapshot/index undo pattern for every new destructive action.

### 2.8 Notifications / Telegram

Reference: `src/utils/telegram.js` posts to a bot; Admin Panel stores a per-user Telegram chat ID. Optional for mobile (push covers most of it) — decide with the user. If kept: a Cloud Function relay, not a client call.

### 2.9 Role-based bottom navigation + Messenger as a primary tab  _(future, user-requested)_

Today the tab bar is a **fixed 5** (`src/app/(app)/(tabs)/_layout.tsx` → Dashboard / Tasks / Inventory / Finance / More) rendered by `src/components/tab-bar/custom-tab-bar.tsx`, and every user sees the same one. Two changes are wanted:

**a) Promote Messenger to the bottom nav.** Messenger is expected to become a much larger part of the app, so it should be a primary destination (its own tab with an unread-count badge), not a More-hub card pushed on the stack. It moves out of `MORE_MODULES` in `src/constants.ts` and into the tab set; the two-pane list↔thread screen stays but gets a `messenger/[threadId]` route so a push notification can deep-link straight to a thread.

**b) Per-role tab sets.** The bottom bar should be composed from the signed-in user's role (and per-user permission overrides — see 2.2), not hardcoded. Different roles get a different bar:

- An **accountant** (`nepal_admin` with finance permissions, e.g. the "Sunam Deepa" persona) → Dashboard · **Finance** · **Billing** · Messenger · More.
- An **admin** (`super_admin` / `uk_admin`) → Dashboard · Tasks · **Approvals/Budget** · Messenger · More.
- A **floor employee / staff** (`employee` / `nepal_staff`) → Dashboard · Tasks · **Attendance** (with the clock-in CTA) · Messenger · More.
- **Nepal ops** (`nepal_admin`, general) → Dashboard · Tasks · Production · Messenger · More.

Design constraints:
- **Fixed slot count (5)** so the bar layout and the custom tab bar's animation don't reflow per role — 4 role-chosen destinations + a permanent **More** that always holds the full permitted module list. Messenger is effectively always one of the 4 for every role (per the user's ask), leaving 3 role-specific slots.
- The tab set is **data-driven**: a `NAV_PROFILES: Record<Role, ModuleId[]>` map (mirrors the reference's `NAV_BY_ROLE` in `src/utils/permissions.js`), filtered through `sectionVisible(profile, id)` so a per-user override can still add/remove a destination. A user whose role isn't in the map falls back to the current default 5.
- Every tab still needs its route registered in `src/app/(app)/(tabs)/`; `expo-router/js-tabs` renders all registered `<Tabs.Screen>`s, so the custom tab bar filters `props.state.routes` down to the role's list rather than conditionally registering screens. Routes not in the active set are still reachable via More (deep link / stack push) — confirm `js-tabs` tolerates a route that exists but is never shown in the bar; if not, keep those as `(app)` stack routes and only the 5 chosen ones under `(tabs)`.
- **More hub** already filters by permission once 2.2 lands — it becomes the overflow for whatever didn't get a slot.

This depends on 2.2 (need a real `profile.role` + permission resolver first) and pairs with 3.15 (Messenger backend). Purely a shell/config change once RBAC exists — no per-screen work.

---

## 3. Module-by-module gap analysis

Format: **Have** = what the mobile screen does now · **Missing** = reference features absent · **Build** = the work item.

### FINANCE CLUSTER (the priority — mobile covers the least here)

---

### 3.1 Finance  `src/screens/finance/`
**Have:** Overview (invented "average margin" bar chart + Payable/Receivable cards + "browse by fiscal year" link + this-month expense list), Years list, Ledger view (month-grouped rows, 3 type filters: bank/journal/expense), Add-expense sheet (amount / category / source / receipt-flag).

Reference `Finance.jsx` is a **9-tab** hub. Mobile implements roughly the "expenses" slice + a bespoke overview. **Missing, in full:**

- [x] **Expenses tab** — `finance/expenses-view.tsx`: rows with category tag, `<Money>` NPR+GBP, `<DualDate>`, VAT-bill chip (View ↗ / + VAT bill), tap-status mark paid/unpaid, long-press delete (cascades VAT bills, undo restores both). `finance_expenses` schema (`category`/`amountNPR`/`date`/`note`/`vatBill`/`status`/`loggedBy`); add-expense sheet gains a BS date picker + `loggedBy` from `useAuth()`. Filters: all / unpaid / VAT bill / no bill. _(2026-08-26)_
- [x] **Purchases tab** — renders `<PurchasesPane showSummary={false} showFab={false}>` (the same component as the standalone screen), gated by `financeTab('purchases')`, with its own "Add purchase" FAB. Multi-line entry, header fields, computed totals, `EXP0NN`, auto stock-in, inline edit, delete — all shared. _(2026-08-26)_
- [x] **VAT Bills tab** — `finance/vat-bills-view.tsx` + `vat-bill-sheet.tsx`: list (item / file+kind / expense id / uploadedBy / `<DualDate>`), upload sheet (pick a bill-less expense, image|PDF, file name), view sheet, delete (undo). Flips the linked expense's `vatBill` flag on add/remove. Cross-links with the Expenses tab (`+ VAT bill` → upload; `VAT bill ↗` → focus here). Real Storage upload = item 5 / Track B. _(2026-08-26)_
- [x] **Journal tab** — `journal-view.tsx` + `journal-sheet.tsx` + `account-picker.tsx` (inline expand-to-select, grouped by type). Post/edit/delete a double-entry (`date` BS picker / amount / Dr / Cr / description / reference), Dr ≠ Cr validation, advance accounts (`Advance Received`/`Advance Payable`) require a party name (`ADVANCE_ACCOUNTS` + `isAdvanceAccount`), `<Money>` NPR+GBP, undo. _(2026-08-26)_
- [~] **Ledger tab** — `account-ledger-view.tsx` + `data/finance/ledger.ts`: running Cash + 4 Bank tables (`Particulars · Dr · Cr · Balance`) derived from `journal_entries` + paid `finance_purchases` + paid `finance_expenses`; **editable opening balance** per account (`opening-balance-sheet.tsx` → `useUpdateAccountOpening`); "Other accounts" card grid (Dr / Cr / entry count / type-coloured balance). **Row deep-links to Purchases/Billing editors, and the paid-invoices + bank-feed sources, join with items 10 / 14** (`LedgerRow.link` is already carried).
- [x] **P&L tab** — `pnl-view.tsx` + `data/finance/pnl.ts` `buildProfitAndLoss()`. Sales Revenue = Σ NPR of collected-invoice payments (`billing` `paid`/`nprOf`), Other Income from journal Cr 'Other Income'; Operating Expenses (`finance_expenses`) · Purchases (`finance_purchases`) · Payroll (Σ `pay(e, aug).net` from Employees) · Journal Expenses (Expense-type Dr accounts, minus Purchases/Payroll) → Net Profit/Loss. Income-vs-Expenses proportion bar + Outgoings split bar + Purchases-by-category (top 8) bars. `<Money>` NPR+GBP. _(2026-08-26)_
- [x] **Balance Sheet tab** — `balance-sheet-view.tsx` + `buildBalanceSheet()`. Per-account balances (Cash/Bank from `accountLedger` closing, rest from `accountSummaries`; 'Profit for the Year' = P&L net), grouped Assets / Liabilities / Equity with totals + the **Assets vs Liabilities+Equity** check row (labelled "out by …" since mock data isn't fully double-entered). _(2026-08-26)_
- [x] **Bank tab** — `bank-view.tsx` + `bank-tx-sheet.tsx`. Log a transaction (bank picker incl. "Other" free text / BS date / description / amount / Credit·Debit / category / reference), In / Out / Net strip, list (colour-coded, `<Money>` + `<DualDate>`), long-press delete + undo. `bank_transactions` mock collection + hooks; the feed now flows into the **Ledger tab's** Cash/Bank running balances (`LedgerSources.bankTransactions`). Real eSewa/Fonepay webhook = Track B. _(2026-08-26)_
- [x] **Order P&L tab** — `order-pnl-view.tsx` + `order-costs-sheet.tsx` + `data/finance/order-pnl.ts`. Per order (from the Sales `orders` mock): revenue (`Order.value`) vs `material / labour / overhead / shipping` entered in a bottom sheet with a live profit/margin preview; **auto labour rate** = last month's production-dept payroll (`pay(e, MONTHS[1]).gross` over Sewing/Cutting/Finishing/Packing) ÷ `LAST_MONTH_UNITS_PASSED` (seeded — mobile Production logs no monthly output yet), applied `rate × qty` for orders with no saved costs; ⚡ auto-labour banner + row marker; margin pills (≥20 % good / ≥0 warn / <0 bad); status filter (All / Active / Delivered) with counts; in-tab KPI strip (Revenue / Costs / Profit / Avg Margin). `order_costs` mock collection + upsert/delete/undo hooks, keyed by order id. `<Money>` NPR+GBP throughout. `financeTab('order-pnl')` gates the tab. **Date-range filter deferred** — mobile's `Order` model carries no date (Sales module, item 25 owns it). _(2026-08-26)_
- [x] **KPI strip** (top of page) — `kpi-strip.tsx`, always shown above the tabs: Payroll MTD · Total Expenses · Total Purchases · Net Profit/Loss, `<Money>` NPR+GBP; Payroll → `router.push('/employees-hr')`, Purchases → switches to the Purchases tab. _(2026-08-26)_
- [~] **Charts** — Outgoings split (proportion bar, not a donut — mobile adaptation) + Purchases-by-category top-8 bars, both on the P&L tab. A true donut can come later if wanted. _(2026-08-26)_
- [x] **Per-tab permission gating** via `financeTabAllowed` — wired for Expenses / Purchases / VAT bills / Journal / Ledger / Bank / P&L / Balance sheet / Order P&L (tab strip hides a tab the profile can't see).
- [x] **Chart of accounts** — `DEFAULT_ACCOUNTS` = 26 (11 Asset / 7 Liability / 3 Equity / 2 Income / 3 Expense), openings on Cash + 4 banks + Share Capital; `accounts` mock collection + `useAccounts` / `useUpdateAccountOpening`. _(2026-08-26)_
- [ ] Keep the mobile Overview's margin/AR/AP cards but back them with real data (AR from unpaid invoices, AP from unpaid purchases + bills, margin from Order P&L).

Skip: Shift+letter tab shortcuts, `sessionStorage` scroll restore (desktop-only).

**Design:** the 9 tabs have no Claude Design screen. Either extend the existing Finance prototype in the Claude Design project first, or confirm building tab-by-tab from `Finance.jsx` directly.

---

### 3.2 Billing  `src/screens/billing/`
**Have:** Invoice list + status filter (all / accepted / collected / cancelled) + summary (outstanding / collected / overdue / FX exposure) + detail view + record-payment sheet (amount / currency / method / account / ref, with over-payment nothing-stops-it) + fake PDF preview + "raise invoice from open challan" + per-invoice FX line.

Reference `Billing.jsx` (+ `utils/billing.jsx`, `InvoicePDF.jsx`): **3 document types** (invoice / challan / quotation), each a tab with its own list + create form. **Missing:**

- [x] **Challan** and **Quotation** as first-class doc types (item 13) — `DocTypeSwitch` (Invoices / Challans / Quotations, with counts) at the top of Billing; `data/billing` gains `Challan` + `Quotation` + `DocLine` types, seed data, `calcTotals` (discount-before-VAT, shared), `nextDocNumber` (gap-free `CH-0NN` / `QT-0NN`), and full hooks (list / add / status / restore-undo). Screen: `DocList` (status-filter chips + rows, `<DualDate>`, own-currency totals), `DocSheet` (shared create form: client block + PAN/phone/address, multi-line items, discount %/flat, status, note; **challan** adds `vehicleNo / driverName / routeFrom / routeTo` + auto `fiscalYear` via `fiscalYearForAD`; **quotation** adds `validUntil` BS picker + `terms` + `currency` NPR|GBP), `DocDetailSheet` (read-only summary + status-transition buttons). VAT is shown as "added on conversion to invoice" — challans/quotations never carry it. FAB gated by `can('billing')`; `<PermissionNotice>` for read-only. Invoice tab unchanged. _(2026-08-26)_
- [x] **Create / edit invoice form** (item 14) — `invoice-sheet.tsx` (`InvoiceSheet` + `InvoiceDraft` + `emptyInvoiceDraft`): client chips + free-text name, PAN/phone/address, NPR|GBP currency, BS `<NepaliDatePicker>` for issue + due, payment terms, multi-line editor (`desc / qty / unit chips / rate` + live per-line amount + add/remove), 13% VAT toggle, **discount as % or flat** (segmented), `paymentType` Cash|Bank|Credit + bank chips, `Draft`/`Sent` status, notes, and a live totals card (`calcTotals` — subtotal → discount → taxable → VAT → grand, + NPR-equiv line for GBP). Wired in `index.tsx` via `openNewInvoice` / `openEditInvoice` / `handleSaveInvoice`; FAB opens it for the invoice doc type. _(2026-08-27)_
- [x] **PAN required when invoice total > NPR 50,000** (item 14) — `PAN_REQUIRED_ABOVE_NPR` constant; inline note in the sheet turns to a danger message + the save button switches to "Add the client PAN to continue" and disables; `handleSaveInvoice` re-checks and blocks with a toast. _(2026-08-27)_
- [x] **Convert quotation → invoice** (item 15) — `draftFromQuotation()` in `invoice-sheet.tsx` copies the client block + lines (GBP → NPR at `RATES.GBP`), switches VAT on, resets terms to Net 30; `DocDetailSheet` gains a "Convert to invoice" button (quotations not yet billed / cancelled / rejected) that opens the prefilled `InvoiceSheet`. On save, `handleSaveInvoice` stamps `invoice.relatedQuotation` and fires `updateQuotation` → `{ status: 'Accepted', relatedInvoice: <new ref> }` (new `useUpdateQuotation` hook + `updateQuotation` mock-api). "Already billed on …" note shown once linked. _(2026-08-27)_
- [x] **Cancel** (item 14) — `handleCancelInvoice` sets `cancelled: true` + a dated `cancelNote` ("record retained for IRD"), with Undo; the record stays listed and filterable under the `Cancelled` chip. "Cancel invoice" is a `dangerOutline` action on the detail view, hidden once any payment is recorded or it's already cancelled. _(2026-08-27)_
- [x] **Edit** an existing invoice (item 14) — detail view gains an "Edit invoice" action (gated on `can('billing')`) that opens `InvoiceSheet` prefilled via `draftFromInvoice`; `handleSaveInvoice` routes to `updateInvoice` when `draft.id` is set, keeping the same `ref`. _(2026-08-27)_
- [x] **Status model** (item 14) — `InvoiceStatusFull` = Draft / Sent / Partial / Paid / Overdue / Cancelled + `statusFull(v)` (Draft/Sent user-set, the rest derived from payments + `dueISO`), `INVOICE_PILL` colours. Filter chips, `InvoiceRow`, and the detail header/pill all use it; auto-Overdue past the due date. _(2026-08-27)_
- [x] **Payment ceiling** (item 14) — `handleSavePayment` converts the entered amount into the invoice's currency and rejects anything above the outstanding `balance(v)` with a toast; Partial vs Paid then fall out of `statusFull` automatically. _(2026-08-27)_
- [x] **CSV export** of the filtered list (item 15) — new dependency-free `src/lib/export/csv.ts` (`toCSV(rows, columns)` with RFC-4180 quoting); a download icon in the Billing header serialises the current filter+search result (Invoice / Client / Issued / Due / Status / Currency / Total / Paid / Balance / Total NPR) and copies it to the clipboard via `expo-clipboard` (added), with a toast. Real file-write / share sheet still deferred to item 5. _(2026-08-27)_
- [ ] **AD / BS date toggle** on the list (needs 2.4).
- [x] **Real PDF** (item 16 / 2.5) — `src/lib/pdf/invoice.ts`: `expo-print` rasterises an IRD tax-invoice HTML (seller PAN + letterhead, buyer name/PAN/phone/address, line table, **discount-before-VAT** taxable-value vs VAT split, dual BS/AD issue+due dates + fiscal year, **amount in words** (Indian Lakh/Crore), NPR-equivalent for FX invoices, "Copy of Original — N" reprint counter), then `expo-sharing` opens the OS share sheet. `pdf-preview.tsx`'s Email/Download buttons now call it for real (both share the file); `printCounts` state drives the reprint counter. `expo-print` + `expo-sharing` added (`expo-sharing` config plugin registered in `app.json`). _(2026-08-27)_
- [ ] **Sequential per-fiscal-year numbering** assigned at issue, gap-free (`getNextNumber` → per-FY counter per `NEPAL_COMPLIANCE_PLAN.md` Phase 2).
- [ ] **FX converter** (2.3) on line-item rate.
- [ ] **Stock auto-deduct** on invoice creation for stock-linked lines (`postSaleStockOut`).
- [x] **Search** box (item 15) — a `<TextField>` above the invoice filter chips; matches on client name, `ref`, sales order, or status text, and the empty state reflects the query. _(2026-08-27)_
- [x] Accept a `?focus=&autoEdit=` deep link from Finance ledger (item 15) — `src/app/(app)/billing.tsx` reads `focus` + `autoEdit` via `useLocalSearchParams`; `Billing` takes `{ focus?, autoEdit? }` and a mount effect opens that invoice's detail (match on id or ref) and, when `autoEdit` + `can('billing')`, its edit sheet. Emitting side from the Finance ledger rows joins with items 8/10. _(2026-08-27)_

**Design:** challan/quotation forms and the create-invoice form have no prototype — design or build-from-source decision needed.

---

### 3.3 Purchases  `src/screens/purchases/`
**Have:** Entry list grouped by date or supplier, filter (all / unpaid / cash / bank), detail view, add sheet (amount / supplier / item / method / status / date / bill-flag), mark-paid.

Reference `Purchases.jsx` + `PurchaseRowGroup.jsx`: **(rebuilt in item 7 — see below)**

- [x] **Multi-line-item** entry (`particulars / qty / unit / rate` per line, add/remove lines) — `add-sheet.tsx` line-items editor with live per-line amounts. _(2026-08-26)_
- [x] **VAT-bill flag + discount amount + taxable amount** → computed `subtotal / VAT (13%) / grand total` via `computeTotals()` (single source of truth for the math). _(2026-08-26)_
- [x] **Inline edit** of a saved purchase — detail sheet → "Edit purchase" opens the same sheet prefilled; `draftFromEntry()`. _(2026-08-26)_
- [~] **Delete with cascade** — `deleteEntry` removes the purchase; `vat_bills` live in Finance (item 6), `stock_movements`/`journal_entries` collections don't exist yet (items 19 / 8). Undo restores via snapshot.
- [x] **Auto stock-in** for lines matching an inventory item name — `useAdjustStock` / `adjustStockByName` (case-insensitive), bumps `qty`, toasts what was stocked in. _(2026-08-26)_
- [x] **Search** by party / category / `EXP` id (`list-summary.tsx` search field). _(2026-08-26)_
- [x] `EXP0NN` id sequence (`nextExpenseId`, gap-free) shared with Finance's Purchases tab — one `src/data/purchases` module, `buildEntry()` used by both surfaces. _(2026-08-26)_
- [x] GBP secondary amounts — `<Money>` throughout rows / detail / totals. _(2026-08-26)_
- [~] Payment type Bank → bank-name field (chips + free text). Auto-provision an Asset account for a new bank name waits on the chart of accounts (item 8).

---

### 3.4 Accounting  `src/screens/accounting/`  — **done (item 12)**
**Was:** Balance-sheet tree + a log-entry sheet, on a bespoke delta-based `adjustments` mock with an invented chart of accounts.

**Now:** `src/screens/accounting/index.tsx` is a 1-line wrapper — `<Finance variant="accounting" />`. The reference `Accounting.jsx` is `Finance.jsx` minus 5 tabs on the *same* `journal_entries` + `accounts` data, so Accounting reuses the shared Finance hub with a `variant` prop that swaps the header (`Accounting` / `Double-entry · FY 2082/83`), the KPI strip (`AccountingKpis` — Total income / Total expenses / Net P&L / entry count, per the reference's 4 stat cards), and the tab set (Journal / Ledger / P&L / Balance sheet only, always shown). The old `src/data/accounting/*` module + `ledger-view` / `log-entry-sheet` / `sheet-view` are deleted.

- [x] **Journal entries list** — shared `JournalView` (date / description / Dr / Cr / `<Money>` NPR+GBP / reference / postedBy, tap-to-edit) replaces the post-only sheet.
- [x] **P&L view** — shared `PnlView` + `buildProfitAndLoss` (statement + proportion/bar charts).
- [x] **Ledger "other accounts" grid** — shared `AccountLedgerView` (`accountSummaries` Dr/Cr/entry-count/type-coloured balance grid, plus the Cash/Bank running tables it adds on top).
- [x] **Reference field + party name** on entries — shared `JournalSheet` (`reference`, and `partyName` required on advance accounts).
- [x] **Real 26-account chart of accounts** — now the same `DEFAULT_ACCOUNTS` as Finance; the invented `ChartNode` set is gone.
- [x] **Decision #2 → (a)** — standalone Accounting screen kept, as a thin `variant` re-use of Finance. Edit-gated on `can('accounting')`.

---

### 3.5 Budget & Requirements  `src/screens/budget-requirements/`
**Have:** Requirements list (pending / decided buckets), manual staff/admin role toggle, approve / decline, add sheet (category / item / amount / priority / needed-by / note / quote-flag), monthly cap progress bar, filter chips (all / pending / high / mine).

Reference `Budget.jsx` = **2 tabs: Budget Requests + Requirements**. Mobile only built "Requirements". **Missing:**

- [x] **Budget Requests tab** (item 17) — new `budget_requests` mock collection (`BudgetRequest` type + 6 seeds + `fetch/add/update/restore` api + hooks). GBP-primary amount with live NPR (`× GBP_RATE` 200) in `request-sheet.tsx`; category set `Equipment / Materials / Services / Training / Travel / Other` (`BUDGET_CATEGORIES` + `BUDGET_CATEGORY` colours + Feather icon per category); `Low/Medium/High` urgency; justification required (≥12 chars, red border until met); `BR-00NN` id sequence; `RequestGroup` list (GBP primary + muted NPR, Pending/Decided buckets) + `RequestDetailView` with Approve/Reject stamping `reviewedBy`. _(2026-08-27)_
- [x] **Requirements tab** parity — `Requirement` gains `quantity` (free text) + `amountGBP`; category set swapped to the reference `REQ_CATEGORIES` (`Raw Materials / Tools / Machinery / Office Supplies / Safety Equipment / Other`, with icons + colours); `add-sheet.tsx` gains a Quantity field and a dual **रु / £** cost entry (type either side, the other converts at `GBP_RATE` with an "auto" tag); `requirement-group.tsx` + `detail-view.tsx` render the amount via `<Money>` (NPR+GBP) and show quantity. _(2026-08-27)_
- [~] **Status filter** Pending / Approved / Rejected / All + **urgency filter** — **done on the Budget Requests tab** (`review-filters.tsx`, shared component: status chips with counts + urgency pills). Requirements tab keeps its existing `All / Pending / High / Mine` chips.
- [x] **Pending count badges** on each tab (item 17) — `budget-tabs.tsx` two-tab switcher shows a live pending count badge per tab. _(2026-08-27)_
- [x] Drive role from `useAuth()` (item 3 removed the manual toggle); Budget Requests approval gated on `canApprove(profile)` (UK director / `uk_admin`+), and the FAB on `can('budget-requirements')`. _(2026-08-27)_
- [x] "New request" modal for Budget Requests (item 17) — `request-sheet.tsx`, separate from the Requirements `add-sheet.tsx`; its own FAB on the Requests tab. _(2026-08-27)_

---

### OPERATIONS

---

### 3.6 Production  `src/screens/production/`
**Have:** Batch list + detail + activity log + calendar view + add-batch sheet + status filter chips + list/calendar tab switch.

Reference `Production.jsx` (2083 lines) + `ProductionCalendar.jsx`: a pipeline + batches + **orders** hub. **Missing:**

- [ ] **Orders** sub-module — create/edit a production order (`customerName / styleName / quantity / pricePerPcNPR / stage / status`), drag between the 7 stages, expand for detail. (Overlaps the undesigned Order Management module — decide whether Production owns order CRUD or just consumes orders. Reference has both `Production.jsx` orders **and** `OrderManagement.jsx`.)
- [ ] **Dispatch flow** — mark an order dispatched, record assignment, notify.
- [ ] **Issue invoice from an order** — inline invoice fields + "apply suggestion", writes to `invoices` (reference `buildInvoiceDoc`).
- [ ] **Order costs entry** + auto labour rate (shared with Finance Order P&L — 3.1).
- [x] **Batch output logging** (item 23) — `Batch.output?: {checked, passed, failed}` + `BatchOutputDraft`; `output-sheet.tsx` (checked / passed, failed auto-fills, live pass-rate preview) opened from a new "Output & QC" card in the batch detail (stat row + pass-rate bar), persisted via `useUpdateBatch` with an auto activity note. Pass rate = `passed / (passed + failed)`; Dashboard wiring is item 29.
- [ ] **Photo notes** on a batch — real upload (2.6), replace the flag.
- [ ] **Stage config** consumed from Admin Panel (`stage_config` collection) rather than a hardcoded list.
- [ ] Production calendar parity with `ProductionCalendar.jsx` (per-day batch/output cells).

---

### 3.7 Quality Control  `src/screens/quality-control/`
**Have:** Inspection queue + detail with checklist points, verdict bar (pass/flag/fail), evidence photos (flag), notes, "cleared" counter.

Reference `QualityControl.jsx` (211 lines — small): a QC-log form per batch. Mobile is **richer in interaction** but disconnected. **Missing:**

- [x] Tie the queue to real `production` batches (item 24) — `seedQueue` is now **derived from `seedBatches`** (QC gates stages cutting/finishing/packing, active/hold only); each `QueueItem` carries a `batchId`, sample size ≈ 5% of qty, gate label from the stage transition.
- [x] Persist a `qc_logs` record on verdict (item 24) — `QcLog` type + `seedQcLogs` (4 historical) + `fetchQcLogs`/`addQcLog`/`restoreQcLogs` api + `useQcLogs`/`useAddQcLog`/`useRestoreQcLogs`. Every verdict (quick pass/flag/fail on the card, or the full checklist submit) writes `{batchId, code, product, date, checkedCount, passedCount, defects, passRate, verdict, defectNotes, inspector}`; checklist submit passes real counts, quick verdicts synthesise a rate. Undo restores the log too.
- [x] **Pass-rate rollup** (item 24) — `QueueSummary` now takes props computed from the logs: mean pass rate + failed/flagged counts over the last 7 days (falls back to all-time when the window is empty). Feeding the **Dashboard** QC card is item 29.
- [ ] Real evidence photo upload (2.6) — still a flag; needs `expo-image-picker` (item 5).
- [x] Defect-notes free text (item 24) — the detail view's inspection-note field is now persisted into `QcLog.defectNotes`.

---

### 3.8 Inventory & Library  `src/screens/inventory/`
**Have:** Stock list + search + add-item sheet (name / qty / threshold / unit) + detail (with a movements list) + library rows (read-only: fabrics/processes/samples/patterns shown as flat rows).

Reference `Inventory.jsx` is the **largest page in the app** (4018 lines) — Stock + a full Library. **Missing:**

- [x] **Stock adjust / stock-in / stock-out** posting (item 19) — real per-item `movements` collection (`StockMovement` = `{itemId, kind: in|out|adjust, delta, balance, reason, ref, date}`) + `fetchMovements` / `postStockMovement` / `updateStockItem` / `restoreInventory` api + hooks. `adjust-sheet.tsx`: pick In / Out / Adjust-to, quantity (with live "on hand after" preview), reason, reference → updates `item.qty` and appends a ledger row with running balance. `detail-view.tsx` renders the real per-item ledger (empty state when none); Purchases auto stock-in now also writes a movement row. Undo restores stock + movements. _(2026-08-27)_
- [~] **Low-stock alerts** — the inventory list already had the below-reorder banner + filter (`stockLevel(s) === 'low'`); movements now feed it live. Driving the **Dashboard** "below reorder" KPI is item 29.
- [ ] **Library CRUD** for all four kinds:
  - **Fabrics** — name, GSM, composition, width, supplier, cost.
  - **Processes** — name, type (e.g. DTG Printing), rate, notes.
  - **Samples** — name/version, photo, status.
  - **Patterns / Tech Packs** — name, **multi-page tech-pack image upload**, **measurements table** (point / spec / tolerance rows), **fabric-composition rows**, front/back sketch images.
- [ ] **Tech-pack / sample image viewer** (reference `DocPreview.jsx`) — pinch-zoom multi-page.
- [x] Editable thresholds, lead time, location, unit cost, supplier per item (item 19) — `edit-sheet.tsx` (`StockDetailsDraft`) opened from an "Edit" link in the detail view's new Details header → `useUpdateStockItem`. _(2026-08-27)_

**Design:** the Library editors (esp. tech packs) have no prototype — needs Claude Design work.

---

### SALES & CRM

---

### 3.9 Sales  `src/screens/sales/`
**Have:** Order list + stage filter + detail with size breakdown + update-order + restore. Models "orders" as its own `sales` mock collection.

Reference `Sales.jsx` (197 lines) is a **read-only pipeline overview** derived from `production` orders: KPI row (Active / Units in pipeline / Delivered this month / New this week), pipeline-by-stage bars, top customers, recent active orders table. The **CRUD** lives in `OrderManagement.jsx` (Section 4.1).

- [ ] Decide the split: **Sales = overview dashboard** (build the KPIs + stage bars + top-customers from the real orders collection), **Order Management = the CRUD board** (Section 4.1). Mobile's current Sales screen is closer to Order Management — likely rename it and build a thin Sales overview, or fold overview into the Dashboard's Sales card.
- [ ] Pipeline value = Σ `qty × pricePerPc`.

---

### 3.10 Customers  `src/screens/customers/`
**Have:** List + search + detail + add/edit form + swipe-to-delete + confirm sheet. Type (business/individual), contact, email, phone, city, country, address, terms, orders[], invoices[].

Reference `Customers.jsx` (244 lines): list (sorted by name) + add/edit + delete. Mobile is **at or above parity.** **Small gaps:**

- [x] Back `orders` / `invoices` history with real data (item 35) — `src/data/customers/joins.ts` (`ordersForCustomer` from Sales `useOrders`, `invoicesForCustomer` from Billing `useInvoices`, matched by customer/client **name**, GBP-normalised, status via `statusFull`); `customers/index.tsx` builds a `detailCustomer` from the live join for the detail view, falling back to the seed arrays when nothing matches (Kew Lane / Anita / Daniel have no live records and keep their seeds). _(2026-08-27)_
- [~] Confirm the field set matches what Tasks/Billing/Production expect when they reference a customer — Billing joins on `CLIENTS[client].name` / `clientName`, Sales on `Order.customer` (both plain strings); no shared id yet. Good enough for the join; a canonical `customerId` is a Firebase-era concern.

---

### PEOPLE

---

### 3.11 Employees & HR  `src/screens/employees-hr/`
**Have:** Directory + Payroll views, employee add/edit sheet, salary slip screen, payroll month selector + approval, SSF deduction calc, per-employee pay fields (basic / allowance / OT / bonus / advance / absent / late / tax).

Reference `Employees.jsx` (1063 lines): Directory + **Org Chart** + Payroll tabs. **Missing:**

- [x] **Org Chart tab** (item 28) — `reportsTo?: number` added to `Employee` + seeded into `PEOPLE` (Kabita → Anil/Rabin → operators, etc.); `tabs-header.tsx` refactored to a 3-tab map (Directory / Org chart / Payroll·ADMIN); new `org-chart-view.tsx` flattens the reportsTo tree into an indented, tappable list (inactive rows dimmed, direct-report count badge). _(2026-08-27)_
- [~] **Create Firebase login** for a new employee (item 28) — an edit-sheet "Create app login" action, currently a queued-invite toast (real Firebase Auth is Track B).
- [x] **Status toggle** (Active / Inactive) + delete (item 28) — the edit sheet already toggles `active` (persisted through `handleSave`); added "Remove from directory" → `useDeleteEmployee` with Undo (`useRestoreEmployees`); auth-cleanup is noted in the toast (Track B).
- [x] **Attendance-driven payroll auto-calc** (item 28) — `src/data/employees-hr/attendance-sync.ts` `attendancePrefill(team, employee)` name-matches the Attendance roster and reads MTD `absent` / `late` / OT-hours from its `MemberMonth`; the Payroll run card gains a **"Sync absent · late · OT from attendance"** action (`syncFromAttendance` in `index.tsx`) that `updateEmployee`s every matched, out-of-date record so `pay()` recomputes the attendance cut, with a change count + Undo. Shown only while the run is open. _(2026-08-27)_
- [x] **Real salary-slip PDF** (item 28 / 2.5) — `src/lib/pdf/salarySlip.ts` (`expo-print` HTML→PDF of the same SSF letterhead + earnings/deductions/net/words layout, `expo-sharing`); the `SalarySlip` modal's Email/Download both call it.
- [ ] **Points / rewards leaderboard** (reference `user_points`, `useLeaderboard.js`, `RewardContext`) — optional; confirm scope.
- [ ] **Nepal tax compliance** (deferred, `NEPAL_COMPLIANCE_PLAN.md` Phase 6) — income-tax slabs by marital status, SSF 11 %/20 %, CIT, gratuity — replaces the flat calc.
- [x] Search box — `directory-view.tsx` already has a search field (name / role / code / dept) wired through `index.tsx` `query`; confirmed present. _(2026-08-27)_

---

### 3.12 Attendance  `src/screens/attendance/`
**Have:** "Mine" view (clock card with a live local timer, monthly summary, month calendar), "Team" view (roll call totals, per-member rows with status), status ramp (present/late/absent/half/leave).

Reference `Attendance.jsx` (689 lines) + `ClockInCard.jsx`: **Missing:**

- [x] **Real GPS geofenced clock-in** (item 26 / 2.6) — `src/lib/geo.ts` (`haversineDistance` / `evaluateGeofence`, `WORK_SITE`, `GEOFENCE_RADIUS_M = 100`, `GPS_ACCURACY_THRESHOLD_M = 500`); `use-geo-clock-in.ts` takes a fix via `expo-location`, blocks the clock-in outside 100 m or when accuracy > 500 m (card banner + "Clock in anyway" bypass, flagged for review), shows distance + fix accuracy. `clockedInAt` stamped server-side (mock `new Date()`). _(2026-08-27)_
- [x] **Late-cut calculation** (item 26) — `src/data/attendance/schedule.ts` `calculateAttendanceStatus(name, clockInDate)` compares to `EMPLOYEE_SCHEDULES[name]` (`DEFAULT_SHIFT` fallback); > 10 min past start ⇒ `lateCutApplied`, stores `status` / `lateMinutes` / `lateCutApplied` on the punch + a warn toast. _(2026-08-27)_
- [x] **Admin daily roll-call** (item 27) — the Team view gains an "Edit roll call · <date>" toggle; in edit mode each row shows a 5-way status chip set (present/late/absent/half/leave), each tap commits via `useSetMemberStatus` (mock-api `setMemberStatus` also derives `times`/`hours` from the status) with an Undo toast (`useRestoreTeam`); "Done" reports the change count. `teamDb` is now a mutable copy so edits persist.
- [x] **Employee report view** (item 27) — tapping a member row (outside edit mode) opens `employee-report-sheet.tsx`: month tallies (present/late/absent/half/leave) + OT hours + hours-MTD from a new per-member `month: MemberMonth` on the roster, with an **Export report (CSV)** button. The Team card's export button now builds a real roll-call CSV (`src/lib/export/csv.ts` → `expo-clipboard`), not a toast.
- [x] **Weekly bar chart** of hours/attendance — `weekly-hours.tsx` (per-week bars vs a target tick, met/under coloured) on the "Mine" view; `WEEKLY_HOURS` seed. _(2026-08-27)_
- [x] `clock_ins` vs `attendance` as two collections — roster edits persist to a mutable `teamDb` (the reconciled daily record, item 27); the raw-punch `clock_ins` collection now exists (`ClockPunch` + `punchesDb` + `fetchClockPunches` / `useClockPunches`, item 26) capturing `lat/lng/accuracyM/distanceToSiteM/bypassUsed` + the late-cut verdict per punch. _(2026-08-27)_
- [x] BS dates on the calendar (2.4) — `month-calendar.tsx` header now carries the Bikram Sambat span (`bsFromAD` over `MONTH_ISO_START`/`END`, e.g. "Shrawan 17–Bhadra 15, 2083 BS") under the AD month title. _(2026-08-27)_

---

### 3.13 Dashboard  `src/screens/dashboard/`
**Have:** One fixed layout — KPI grid (3: active orders / attendance / below-reorder), orders-by-stage card, attendance breakdown card, approvals list with approve/reject+undo. `RefreshControl` (documented simplification vs the design's dashed pull-box).

Reference `Dashboard.jsx` (1653 lines) is **role-adaptive** — 3 distinct dashboards + `onSnapshot` live data. **Missing:**

- [ ] **Nepal Admin dashboard** — attendance today (clickable staff list), production pipeline by stage, task board summary (To Do / In Progress / Blocked / Done counts), finance snapshot (month expense NPR + GBP, pending budget requests), inventory low-stock alerts, QC pass-rate.
- [ ] **UK Admin / Director dashboard** — total invoiced / paid / outstanding in GBP, **real-time bank balances** (`BankBalanceWidget.jsx`, from the bank feed), order pipeline active vs completed, budget approvals inline (approve/reject on the dashboard), payroll commitment GBP, headcount.
- [ ] **Employee / Staff dashboard** — prominent **GPS clock-in CTA**, my assigned tasks, my monthly attendance log + late minutes.
- [ ] Role switch driven by `profile.role` (2.2).
- [ ] Live data via `onSnapshot` on payroll / expenses / purchases / orders / invoices / employees.
- [ ] `product_costs` editor (reference has an inline one on the dashboard) — or move to Inventory/Finance.

**Design:** the two extra dashboard variants have no prototype.

---

### COMMS / SYSTEM

---

### 3.14 Marketing  `src/screens/marketing/`
**Have:** Month grid calendar + day panel + entry sheet (kind: campaign/post/email/event, title, notes, person) + list view + kind filter.

Reference `MarketingCalendar.jsx` (724 lines) + live `content_calendar` collection (`title / type "Shoot"|"Publish" / scheduledDate / timeSlot / mediaUrl / status "scheduled" / notes`). **Missing:**

- [ ] Align the entry model to the live `content_calendar` shape (`type` Shoot/Publish, `timeSlot`, `mediaUrl`) — mobile's invented `kind` (campaign/post/email/event) doesn't match.
- [ ] **Platform** field (Instagram / Facebook / TikTok / …) and **content-type** (Reel / Carousel / Story / …) — the separate `content` collection carries these (see 4.2).
- [ ] Drag an entry to another day; recurring entries.
- [ ] Week / agenda views.
- [ ] Assignee from the employee list.
- [ ] Overlaps the undesigned **Content Calendar** (4.2) — Marketing = campaigns, Content = the publishing/approval workflow. Confirm whether to keep both or merge.

---

### 3.15 Messenger  `src/screens/messenger/`
**Have:** Thread list + thread view + composer + message bubbles. Two-pane list↔thread toggle. Attach + search buttons are toast stubs. Reached as a More-hub card pushed on the `(app)` stack.

> **Growing surface (user-requested):** Messenger is expected to become a much larger part of the app. It should be **promoted to a permanent bottom-nav tab** with an unread-count badge (see 2.9), get a `messenger/[threadId]` route for push deep-links, and later likely gain group channels, mentions, pinned announcements, and per-thread notification settings. Scope the backend (below) with that trajectory in mind rather than the current minimal two-pane view.

Reference `Messenger.jsx` (715 lines): live Firestore `messages` (ordered by timestamp) with a demo fallback, search, send, **Telegram bridge**, relative timestamps, auth headers for an external API. **Missing:**

- [ ] Real backend — `messages` collection, `onSnapshot`, optimistic send.
- [ ] Working **search** (threads + message text).
- [ ] **Attachments** (2.6).
- [ ] Read receipts / unread counts backed by data (mobile has `useReadStatus` mock).
- [ ] Announcements (broadcast) vs 1:1 threads.
- [ ] Push on new message (2.6).
- [ ] Optional Telegram relay (2.8).

---

### 3.16 Admin Panel  `src/screens/admin-panel/`
**Have:** Role → 20-section access matrix (hidden / view / edit), staged edits, review sheet, apply. **Intentionally diverges** from the reference (which is about production-chain stage config).

Reference `AdminPanel.jsx` (665 lines): **Missing:**

- [ ] **Per-user permission overrides** (not just per-role) — user list, expand a user, toggle each nav section + each of the 10 Finance sub-tabs, **reset to role default**. This is the real RBAC surface (`users/{uid}.permissions`).
- [ ] **Telegram chat ID** per user.
- [ ] **Production stage config** (`stage_config` collection) — the chain Production/Sales/Order Management read.
- [ ] **Dispatch timeout** hours + **production-workers** toggle (who counts toward the auto labour rate).
- [ ] Real persistence + audit of permission changes.
- [ ] Keep the role-matrix view as a "defaults" tab; add the per-user overrides as the primary tab.

---

### 3.17 Changelog  `src/screens/changelog/`
**Have:** Static release list, grouped by release, entry detail sheet, filter chips. Read-only.

Reference `Changelog.jsx` (232 lines): pulls **real git commits from the GitHub API**, paginated, cached in `sessionStorage`. **Options:**

- [ ] Wire to the GitHub commits API for the mobile repo (paginate, cache in AsyncStorage), **or**
- [ ] Keep it static and curated (acceptable — lowest value). Decide with the user.

---

## 4. Undesigned modules — no screen exists yet

These need a Claude Design screen (same style guide) **or** an explicit "build from reference source without a design" go-ahead before starting.

### 4.1 Order Management  — reference `OrderManagement.jsx` (868 lines)
7-stage kanban: **Ordered → Cutting → Sewing → Printing → QC → Shipping → Delivered**. Per order: `customer / item / quantity / priority (Normal/High) / status`. Create order (form or drop into a stage), drag between stages, change priority, cancel (with confirm) + restore, remove, kanban **and** table view. Closest built pattern: Production's board. **Reconcile with Production's own order handling (3.6) and Sales (3.9) — one source of truth for `orders`.**

### 4.2 Content Calendar  — reference `Content.jsx` (176 lines)
Social publishing workflow: entry = `date / platform / contentType / topic / status`. Grouped-by-date list. Status flow **Draft → Pending Approval → Posted**, where non-UK-admins can't set Posted (their "Posted" auto-becomes "Pending Approval"); UK admin approves. Distinct from Marketing (3.14) — confirm keep-both vs merge.

### 4.3 Bug Report  — reference `BugReport.jsx` (168 lines)
Single form: `title / description / severity (Low/Medium/High/Critical) / optional screenshot (PNG·JPG·WEBP, 8 MB cap) / submittedBy` (auto from profile). Submitting states: idle / submitting / success / error. Writes to a `bug_reports` collection (+ Storage for the screenshot). Small; good first Phase-8 build. On mobile, wire the GitHub issue templates (`.github/ISSUE_TEMPLATE/bug_report.md`) style fields.

### 4.4 Fiscal Year Transactions  — reference `FiscalYearTransactions.jsx` (248 lines)  — **done (item 18)**
Drill-down list of every transaction in one fiscal year across **6 types** — Expense / Purchase / Payroll / Journal / Bank / Sales — with per-type breakdown cards, Money-In / Money-Out / Net strip, type filters, and prev/next-year nav. Built by extending the existing Finance FY drill (`ledger-view.tsx`), not a new screen:
- [x] `LedgerRowType` widened to the 6 sources; `LEDGER` mock gains `purchase` / `payroll` / `sales` rows across FY 2082/83 and a new **FY 2081/82** block so year nav has somewhere to go.
- [x] **Money-in / Money-out / Net strip** (responds to the active type filter).
- [x] **Per-type breakdown cards** — icon + count + in/out sums per source; tapping one toggles that type filter.
- [x] **Year nav** — prev/next chevrons over `YEARS` (newest↔oldest), resets the type filter on change; the FY header + KPIs re-derive from the new `yearId`.
- [x] Type-filter chips now list all present sources; each ledger row is prefixed with its source label.
- [ ] Text filter + the reference's per-type drill-through links are still out (low value on mock data).

---

## 5. Phased build plan

Ordered by dependency and value. Each numbered item is a self-contained Claude prompt.

### 5.0 Solo-executable backlog — no user input, no Firebase config, no decisions

Everything here can be built **now**, on the existing mock layer, from the reference `.jsx` + `src/theme/` tokens, verified with `npx tsc --noEmit` + `npx expo export -p ios`. All Track A. Ordered for a sensible run. Items needing a design pass are still listed — they'll be built straight from the reference source with existing tokens (per decision #5's "build directly" option) unless the user says to design first.

**Ready with zero caveats:**
- [x] **25 · Sales — pipeline overview.** Rebuild the current Sales screen as a read-only overview from the mock `orders` collection: KPI row (pipeline value = Σ `qty × pricePerPcNPR`, active vs completed counts, this-month delivered), per-stage bars off `stage_config`'s chain, top-customers list. The existing CRUD-ish Sales screen becomes the seed for Order Management (item 22). _(2026-08-30)_
- [x] **33 · Bug Report module.** Net-new screen + `src/data/bug-reports/` mock (`title, area, severity, steps, status, reportedBy, createdAt` + `screenshot` flag until item 5's image-picker). List + filter + create sheet + status transitions + `can('bug-report')` gating + undo. Add to `MORE_MODULES` + `(app)` route. Model on reference `BugReport.jsx`. _(2026-08-30)_
- [x] **34 · Changelog — GitHub commits feed.** Swap the static list for a fetch of `GET /repos/<mobile-repo>/commits` (paginate, cache in AsyncStorage, pull-to-refresh, offline falls back to cache). Group by day, link each SHA to GitHub. Keeps working with no backend. _(Decision #8 default = live feed; trivially revertible to static.)_ _(2026-08-30)_
- [x] **§2.7 sweep — edit affordances + notices.** Add the missing **edit** sheet to any mock screen that can only create/delete (audit: Sales orders, Tasks, Finance expenses edge cases), and drop `<PermissionNotice>` + `can(section)` FAB gating on every screen that still lacks it. Pure parity pass, no new data. _(2026-08-30 — Tasks/Inventory/Marketing/Production/Quality-Control/Customers/Employees-HR/Messenger/Admin-Panel/Attendance now carry `can(section)` gating + `<PermissionNotice>`. No screens were create-only — every mutating screen already had an edit path (Tasks `TaskEditSheet`, Inventory `EditSheet`, Marketing `EntrySheet` edit mode, etc.). Sales is read-only after item 25; Directors is static.)_
- [x] **CSV wiring leftovers (2.5).** Finance ledger export + any remaining toast-simulated "download/share" → real share via the existing `src/lib/export/csv.ts`. _(2026-08-30 — Finance FY-transactions drill gains a header download button → `toCSV` of the year's ledger rows (respects the type filter) to the clipboard; Employees-HR `exportBankFile` now emits a real payroll-run CSV instead of a bare toast. Matches the established Clipboard-CSV pattern from Billing item 15 / Attendance item 27; a true file/`expo-sharing` share sheet stays with item 5.)_

**Ready, but each needs decision #3 (orders ownership) settled first — recommended answer is in §7:**
- [x] **22 · Order Management.** ~~7-stage~~ 5-stage kanban CRUD board (create/edit order, move between stages writing `stageHistory`, per-order detail, notes). Owns the `orders` collection (`src/data/sales/` — Sales stays a read-only consumer). _(2026-08-30 — decision #3 resolved to the §7 recommendation. `Order` gains `priority`/`status`/`assignedTo`/`stageHistory`/`notes`; new `OrderDraft`, `nextOrderRef`, `STAGE_IDS`; `add`/`setOrderStage` (appends history)/`setOrderPriority`/`addOrderNote`/`setOrderStatus` api + hooks w/ snapshot undo. Screen `src/screens/order-management/`: `index` (Board ↔ List toggle), `board-column` + `order-card` (per-card ‹ › stage move), `order-list-row`, `order-sheet` (create/edit), `detail-sheet` (facts + stage stepper + history timeline + notes + priority + cancel/restore). `can('order-management')` gating + `<PermissionNotice>`; route + `_layout` + `MORE_MODULES` + RBAC section. True drag-and-drop deferred — move buttons match the Production board's pattern. `tsc` clean; `expo export -p ios` OK (5.6 MB).)_
- [ ] **23 (rest) · Production.** Order-costs entry (shared shape with Finance Order P&L), dispatch flow (mark dispatched + assignment), issue-invoice-from-order (inline fields → writes a mock `invoices` doc via `buildInvoiceDoc`). Batch output logging already shipped. Photo notes wait on item 5; stage config wait on item 30. _(Unblocked now that #3 is settled + item 22 owns `orders`.)_

**Ready — would normally get a Claude Design screen first; will build from reference + tokens unless told otherwise (decision #5):**
- [ ] **20 · Inventory — Library CRUD.** Fabrics / processes / samples list + create/edit/delete sheets against new mock collections shaped to live `fabrics` / `processes` / `patterns`. Images stay as URIs/flags until the Storage migration.
- [ ] **21 · Inventory — Patterns / Tech Packs.** Pattern records (style no, product type, sizes, measurements grid, fabric rows) + a multi-page image viewer (pinch-zoom). Mock shaped to live `patterns`.
- [ ] **29 · Dashboard — role-adaptive.** Three variants (Nepal Admin / UK Director / Employee) switched by `profile.role`, each aggregating the mock collections (attendance today, pipeline by stage, task counts, finance snapshot, low-stock, QC pass-rate; director gets GBP invoiced/paid/outstanding + bank balances + inline budget approvals; employee gets the clock-in CTA + my tasks + my attendance). Live data via `onSnapshot` folded in with item 4.
- [ ] **30 · Admin Panel — per-user permission overrides.** User list → expand → toggle each nav section + the 10 Finance sub-tabs + reset-to-role-default, against a mock `users` shape (`permissions: {section: bool}`, matches live). Plus stage-config editor (`stage_config` shape) and a Telegram-chat-ID field. Mock persistence + undo.
- [ ] **32 · Marketing — field alignment.** Reshape the invented `kind` model to live `content_calendar` (`type` Shoot/Publish, `timeSlot`, `mediaUrl`) + add platform / content-type fields, drag-to-reschedule, assignee from the employee list. Content Calendar (4.2) stays a separate module (decision #4 default).

**Track B prep — solo, validated against live prod data via `key.json` read-only (no client config needed):**
- [x] **`src/lib/firebase.ts` scaffold** — init from `EXPO_PUBLIC_FIREBASE_*`, `initializeFirestore` with `persistentLocalCache()` (memory-cache fallback for bare RN), exported but **inert** until config lands (`isFirebaseConfigured` / lazy `getFirebaseApp` / `getDb` / `getFirebaseAuth`, all throw until env vars are set). `firebase@^12.18.0` installed via `npx expo install`. Nothing imports it yet → not in the bundle. _(2026-08-30)_
- [x] **Read-normalisation helpers** — `src/lib/firestore/normalise.ts`: `parseMaybeJson` / `num` / `bool` / `str` / `arr` / `tsToISO` (Firestore `Timestamp` → ISO) / `dedupeByName` (for the 114-doc `accounts` sprawl). Pure, no `firebase` import. Opening-balance + stock-movement *derivation* stays with items 8/19's data files during the actual swap. _(2026-08-30)_
- [x] **Read-only Firestore inspector** — `scripts/inspect-firestore.mjs` (no deps: mints a service-account JWT from `key.json` → `datastore` scope → `listCollectionIds` + sampled `GET`s). Re-confirmed §6 on 2026-08-30 (30 collections; `finance_payroll.lateCutsCount`). GET-only by construction. _(2026-08-30)_
- [ ] **Real `mock-api.ts` bodies behind a `__DEV__` flag** — module by module (finance cluster first), Firestore reads/writes with identical exported signatures, tested against production reads with the inspector above. Ships dark; flips on when config lands (item 4). _(Large per-module pass — do with review between modules.)_
- [ ] **Regenerate mock `types.ts` + seed data from real docs** — so every `src/data/<m>/` shape matches live field-for-field before the swap.

**Blocked — do NOT start solo (need the user):** item 3 real Firebase Auth · item 4 turning on the real data layer · item 5b role tab shell (needs #9) · items 20–21 image→Storage migration (shared-backend change) · item 36 push (needs EAS/Apple) · Phase F compliance (needs #6) · item 37 rewards (needs #7).

### Phase A — Foundations (do first; unblocks everything)
1. [~] **Currency module** (2.3) — `GBP_RATE`, converters, `CurrencyProvider` + toggle, secondary-currency display across Finance/Billing/Purchases/Budget/Employees/Dashboard. **Foundation + toggle + `<Money>` shipped; Purchases wired. Per-module leaf rollout folded into items 6–9/14/17/28/29.**
2. [~] **Nepali date module** (2.4) — `nepaliDate.ts`, `<DualDate>`, `<NepaliDatePicker>`; roll into Billing + Finance first. **Lib + both components shipped; Purchases wired. Per-module date rollout folded into items 6–16/26–27/29.**
3. [~] **Auth + RBAC** (2.2) — real Firebase Auth, `permissions.ts`, `useAuth().can()`, nav/tab filtering, read-only banners, remove manual role toggles. **RBAC layer built on mock-auth: `roles.ts` + `permissions.ts` + `useAuth().can/canView/financeTab`, More+tab-bar filtering, dev role switcher, `<PermissionNotice>`, Budget toggle removed. Real Firebase Auth = Track B (needs config).**
4. **Firebase data layer** (2.1) — init + swap `mock-api.ts` bodies module by module (start with the finance cluster), offline persistence.
5. [~] **Document + native libs** (2.5, 2.6) — `expo-print`/`expo-sharing` PDF+CSV helpers; `expo-location` geofence helper; `expo-image-picker` upload helper; `expo-notifications` FCM registration. **PDF+CSV done early (items 15/16): `expo-print`, `expo-sharing`, `expo-clipboard` installed; `src/lib/export/csv.ts` + `src/lib/pdf/invoice.ts`. `expo-location` + `src/lib/geo.ts` geofence helper done (item 26). Image-picker / notifications still pending (items 20-21 / 36).**
5b. **Role-based navigation shell + Messenger tab** (2.9) — data-driven `NAV_PROFILES` map, custom tab bar filters `props.state.routes` by role/permission, Messenger moved from `MORE_MODULES` into a permanent tab with an unread badge, `messenger/[threadId]` route added. Depends on item 3.

### Phase B — Finance cluster to parity (the priority)
6. [x] **Finance — Expenses + VAT Bills tabs** (3.1) — expense list w/ mark-paid + VAT-bill upload/view. **Done — `FinanceTabs` strip added (Overview / Expenses / VAT bills), data layer reshaped to `finance_expenses` schema, `<Money>`/`<DualDate>` wired, `financeTab()` gating.** _(2026-08-26)_
7. [x] **Finance/Purchases — shared multi-line purchase entry** (3.1, 3.3) — one `finance_purchases` shape, line items, VAT/discount/totals, edit, delete-cascade, auto stock-in, search. **Done — `src/data/purchases` reshaped to the live schema; `PurchasesPane` shared by the standalone screen + Finance's Purchases tab; `<Money>`/`<DualDate>` wired; `useAdjustStock` auto stock-in.** _(2026-08-26)_
8. [x] **Finance — Journal + Ledger + chart of accounts** (3.1) — double-entry post/edit, running Cash/Bank tables, opening balances, other-accounts grid, seed 26 accounts. **Done — `data/finance/ledger.ts` derives Cash/Bank ledgers on the fly; `journal-view`/`journal-sheet`/`account-picker`/`account-ledger-view`/`opening-balance-sheet`; FY-ledger drill renamed `fy-transactions` to free the "Ledger" name.** _(2026-08-26)_
9. [x] **Finance — P&L + Balance Sheet + KPI strip + charts** (3.1). **Done — `data/finance/pnl.ts` (`buildProfitAndLoss` / `buildBalanceSheet`), `pnl-view` / `balance-sheet-view` / `kpi-strip`; P&L pulls Sales Revenue from Billing + Payroll from Employees; charts are proportion/bar (donut deferred).** _(2026-08-26)_
10. [x] **Finance — Bank tab** (3.1) — manual transaction log + in/out/net. **Done — `bank_transactions` collection + hooks, `bank-view` / `bank-tx-sheet`; feed wired into the Ledger tab's running balances.** _(2026-08-26)_
11. [x] **Finance — Order P&L tab** (3.1) — cost entry, auto labour rate, margins, filters. **Done — `order-pnl-view` + `order-costs-sheet` + `data/finance/order-pnl.ts` (`autoLabourRate` / `buildOrderPnl` / `summariseOrderPnl`); `order_costs` mock collection + hooks; consumes Sales `orders` + Employees payroll; in-tab KPI strip + ⚡ auto-labour banner + margin pills; status filter only (Order model has no date). `expo export -p ios` OK; `tsc` clean.** _(2026-08-26)_
12. [x] **Accounting** (3.4) — re-use Finance's journal/ledger/P&L/BS components; add the journal list + P&L it's missing. **Done — `<Finance variant="accounting" />`; new `accounting-kpis.tsx` (4 stat cards); old `data/accounting` module + 3 view files retired. Decision #2 resolved to (a). `expo export -p ios` OK; `tsc` clean.** _(2026-08-26)_
13. [x] **Billing — challans + quotations** (3.2) — the two missing doc types + their forms + numbering. **Done — `DocTypeSwitch` + `DocList` + `DocSheet` + `DocDetailSheet`; `Challan`/`Quotation`/`DocLine` types, `calcTotals`, gap-free `nextDocNumber` (`CH-`/`QT-`), list/add/status/undo hooks; `can('billing')` gating. `expo export -p ios` OK; `tsc` clean.** _(2026-08-26)_
14. [x] **Billing — create/edit invoice form** (3.2) — line items, VAT, discount %/flat, client+PAN, PAN>50k rule, status model, edit, cancel, payment ceiling. **Done — `invoice-sheet.tsx` (`InvoiceSheet`); `index.tsx` create/edit/cancel handlers; `InvoiceStatusFull` + `statusFull` + `INVOICE_PILL` 6-state model wired through filter chips / `InvoiceRow` / detail; payment ceiling in `handleSavePayment`; PAN>NPR 50k blocking; `DetailView` gains Edit + Cancel actions, Bill-to card, discount/taxable totals rows. `tsc` clean; `expo export -p ios` OK (5.3 MB).** _(2026-08-27)_
15. [x] **Billing — convert quotation→invoice, CSV export, search, deep-link** (3.2). **Done — `draftFromQuotation` + `DocDetailSheet` "Convert to invoice" (links `relatedQuotation`/`relatedInvoice`, marks quotation Accepted via new `useUpdateQuotation`); dependency-free `src/lib/export/csv.ts` + header CSV export to clipboard (`expo-clipboard` added); invoice search `TextField`; `/billing?focus=&autoEdit=` params wired through the route + a mount effect. `tsc` clean.** _(2026-08-27)_
16. [x] **Billing — real IRD PDF** (3.2 + 2.5) — replace `pdf-preview.tsx`; per-FY gap-free numbering. **PDF done — `src/lib/pdf/invoice.ts` (`expo-print` HTML→PDF + `expo-sharing`), IRD layout w/ taxable/VAT split, dual BS/AD dates, amount-in-words, reprint counter; wired into the preview modal's actions. `expo-print`/`expo-sharing` added. Per-FY gap-free numbering still open (pairs with item 39 / compliance Phase 2 — invoices carry no `fiscalYear` field yet). `tsc` clean; `expo export -p ios` OK (5.4 MB).** _(2026-08-27)_
17. [x] **Budget & Requirements — Budget Requests tab + filters + real role** (3.5). **Done — `budget_requests` mock collection + hooks; `budget-tabs.tsx` (2-tab switcher w/ pending badges), `request-sheet.tsx` (GBP-primary + live ×200 NPR, required justification, `BR-00NN`), `request-group.tsx`, `request-detail-view.tsx` (Approve/Reject → `reviewedBy`), `review-filters.tsx` (status + urgency, shared). Approval gated on `canApprove(profile)`. Requirements-tab parity now also done (2026-08-27): `quantity` free-text field, dual रु/£ cost entry with auto-convert, reference `REQ_CATEGORIES` set, `<Money>` on rows + detail. `tsc` clean; `expo export -p ios` OK.** _(2026-08-27)_
18. [x] **Fiscal Year Transactions** — extend Finance ledger-view to 6 types + breakdown + year nav (4.4). **Done — `LedgerRowType` widened to bank/journal/expense/purchase/payroll/sales; `LEDGER` mock gains the 3 new types + an FY 2081/82 block; `ledger-view.tsx` gains a Money-in/out/Net strip, tappable per-type breakdown cards, and prev/next year nav; `finance/index.tsx` derives all of it from `yearLedger` + `YEARS`. `tsc` clean; `expo export -p ios` OK (5.4 MB).** _(2026-08-27)_

### Phase C — Operations to parity
19. [x] **Inventory — stock adjust/in/out + low-stock alerts + editable item fields** (3.8). **Done — real per-item `movements` collection + `postStockMovement`/`updateStockItem`/`restoreInventory` hooks; `adjust-sheet.tsx` (In/Out/Adjust-to + live preview), `edit-sheet.tsx` (threshold/lead/location/cost/supplier); detail view shows the real ledger; Purchases auto stock-in writes movement rows; undo restores both. Low-stock banner/filter already present (Dashboard KPI = item 29). `tsc` clean; `expo export -p ios` OK (5.4 MB).** _(2026-08-27)_
20. **Inventory — Library CRUD (fabrics / processes / samples)** (3.8) _(needs design)_.
21. **Inventory — Patterns / Tech Packs + multi-page image viewer + measurements** (3.8) _(needs design)_.
22. [x] **Order Management** (4.1) — 5-stage kanban CRUD; `orders` owned here, Production consumes, Sales read-only (decision #3 → §7 recommendation). **Done — `src/screens/order-management/` (Board/List, per-card stage move, create/edit sheet, detail sheet w/ history timeline + notes + priority + cancel/restore); `src/data/sales/` extended (`Order.priority`/`status`/`stageHistory`/`notes`, `add`/`setOrderStage`/`setOrderPriority`/`addOrderNote`/`setOrderStatus` + hooks, snapshot undo). RBAC section `order-management` + route + `MORE_MODULES`. Built from reference + tokens (no design pass). `tsc` clean; `expo export -p ios` OK (5.6 MB).** _(2026-08-30)_
23. [~] **Production — order costs, dispatch, issue-invoice-from-order, batch output logging, photo notes** (3.6). **Batch output logging done** — `Batch.output` + `output-sheet.tsx` + "Output & QC" detail card + pass-rate bar (`tsc` clean; `expo export -p ios` OK, 5.4 MB) _(2026-08-27)_. Order costs / dispatch / issue-invoice-from-order all depend on decision #3 (orders ownership) and pair with item 22; photo notes need `expo-image-picker` (item 5); stage config needs item 30.
24. [x] **Quality Control — tie to real batches, persist qc_logs, pass-rate rollup, photo evidence** (3.7). **Done — `seedQueue` derived from `production` `seedBatches` (+ `batchId` on each `QueueItem`); `qc_logs` collection (`QcLog` + seeds + `fetch`/`add`/`restore` + hooks); every verdict persists a log (real counts from the checklist, synthesised for quick verdicts) with snapshot undo; `QueueSummary` rolls up mean pass rate + failed/flagged from the last 7 days of logs; inspection note persisted to `defectNotes`. Photo upload still deferred (item 5). `tsc` clean; `expo export -p ios` OK (5.4 MB).** _(2026-08-27)_
25. [x] **Sales — rebuild as pipeline overview** from real orders (3.9). **Done — Sales screen is now read-only: `summary.tsx` → 4 `KpiCard`s (Pipeline value = Σ active `value`, Active orders, Completed, Delivered this month via dynamic month label), new `stage-breakdown.tsx` (`SegmentedProportionBar` + per-stage count/pcs rows off the `STAGES` chain), new `top-customers.tsx` (group by customer → value/order-count, ranked top 5 with mini bars). `index.tsx` composes the three; CRUD pieces (`detail-view.tsx` / `order-row.tsx` / `filter-chips.tsx`, `STAGE_NOTE`) deleted — recoverable from git as the item 22 seed; data layer (`useOrders`/`useUpdateOrder`/`useRestoreOrders`) untouched. `npx tsc --noEmit` clean; `npx expo export -p ios` OK (5.5 MB). Uncommitted.**

### Phase D — People
26. [x] **Attendance — GPS geofenced clock-in + late-cut calc** (3.12 + 2.6). **Done — `expo-location` + `src/lib/geo.ts` (Haversine / geofence eval / `WORK_SITE` / 100 m / 500 m), `src/data/attendance/schedule.ts` (`EMPLOYEE_SCHEDULES` + `calculateAttendanceStatus`, >10 min ⇒ cut), `ClockPunch` (`clock_ins`) + reshaped `toggleClock` payload + `useClockPunches`, `use-geo-clock-in.ts` (permission → fix → geofence), `clock-card.tsx` distance/accuracy line + blocked-banner "Clock in anyway" bypass + late-cut line, `index.tsx` acquire→verify→punch flow with late/bypass toasts. Weekly hours bar chart still open (listed under 3.12). `tsc` clean; `expo export -p ios` OK (5.5 MB).** _(2026-08-27)_
27. [x] **Attendance — admin roll-call editor + employee report + CSV export** (3.12). **Done — Team view edit toggle → per-row 5-way status chips (`useSetMemberStatus` + `setMemberStatus` mock-api derives times/hours; `useRestoreTeam` undo; mutable `teamDb`); `employee-report-sheet.tsx` (month tallies + OT + hours-MTD from new `MemberMonth` roster field) with CSV export; roll-call CSV export via `src/lib/export/csv.ts` + `expo-clipboard` replaces the toast stub. GPS clock-in / late-cut / weekly chart still item 26. `tsc` clean; `expo export -p ios` OK (5.4 MB).** _(2026-08-27)_
28. [x] **Employees & HR — org chart, create-login, status toggle, attendance-driven payroll auto-calc, salary-slip PDF** (3.11). **Done: real salary-slip PDF (`src/lib/pdf/salarySlip.ts`, `expo-print`+`expo-sharing`); Remove-from-directory (`useDeleteEmployee`/`useRestoreEmployees` w/ Undo) + status toggle + create-login stub; **Org Chart tab** (`reportsTo` on `Employee` + seeds, 3-tab header, `org-chart-view.tsx` indented tree); **attendance-driven payroll auto-calc** — `attendance-sync.ts` `attendancePrefill()` + a "Sync absent · late · OT from attendance" action on the open payroll run (`updateEmployee` per matched record → `pay()` recomputes, change count + Undo). Directory search box confirmed already present. `tsc` clean; `expo export -p ios` OK (5.5 MB).** _(2026-08-27)_
29. **Dashboard — role-adaptive (Nepal Admin / UK Director / Employee) + live data + clock-in CTA + bank balances** (3.13) _(2 variants need design)_.

### Phase E — Comms / System / polish
30. **Admin Panel — per-user permission overrides + reset-to-default + stage config + Telegram ID** (3.16).
31. **Messenger — real backend, search, attachments, push** (3.15). Build for the larger trajectory (2.9): group channels, mentions, pinned announcements, per-thread notification settings, deep-link to `messenger/[threadId]`. The tab promotion itself is item 5b.
32. **Marketing — platform/content-type fields + drag + assignee** (3.14); **Content Calendar** (4.2) _(needs design)_ or merge decision.
33. [x] **Bug Report** (4.3). **Done — new `src/data/bug-reports/` mock module (`BugReport`/`BugReportDraft`, `Severity` low→critical, `BugStatus` open→in-progress→resolved→closed, `SEVERITY_META`/`STATUS_META`→`StatusPill` kind/`NEXT_STATUS` chain/`BUG_AREAS`/`nextBugRef` `BUG-0NN`, 6 seeds; `fetch`/`add`/`updateStatus`/`restore` api + `useBugReports`/`useAddBugReport`/`useUpdateBugStatus`/`useRestoreBugReports` w/ snapshot undo). Screen `src/screens/bug-reports/`: `index.tsx` (status+severity filters, severity-then-recency sort, FAB + `PermissionNotice` gated on `can('bug-report')`), `report-row.tsx` (severity dot + `StatusPill` + paperclip when screenshot), `filter-bar.tsx`, `report-sheet.tsx` (title / area chips / severity / steps textarea / screenshot toggle stubbed "image upload soon"), `detail-sheet.tsx` (facts grid + forward status button + Reopen). RBAC: `'bug-report'` added to `SectionId` + `ALL_SECTIONS` + `NAV_BY_ROLE` (all roles) + `EDIT_BY_ROLE` (staff/employee). Route `(app)/bug-report.tsx` + `_layout` entry + `MORE_MODULES` card. `tsc` clean; `expo export -p ios` OK (5.5 MB). Uncommitted.**
34. [x] **Changelog — GitHub commits feed** or confirm static (3.17). **Done — decision #8 → live feed. `src/data/changelog` reshaped: new `types.ts` (`Commit` / `CommitDay` / `CommitFeed{commits,fetchedAt,stale}`), `parse.ts` (`parseCommit` splits the conventional-commit prefix → `ChangeType` + scope + subject/body, `buildFilters` / `groupByDay` / `tally` / `relativeTime` / ported `typePalette`), `api.ts` (`fetchCommitFeed` — 3×100 pages off `api.github.com/repos/crrishav/kazi-mobile/commits`, writes `AsyncStorage` cache, on failure returns the cached feed flagged `stale`, rethrows with no cache), `hooks.ts` `useCommitFeed`. Old `mock.ts` / `utils.ts` / `mock-api.ts` deleted. Screen: `index.tsx` rebuilt with `RefreshControl` pull-to-refresh, loading / error+Retry / offline-cache banner states; new `day-group.tsx` (per-day card, type tag + scope + shortSha + author), `commit-summary-card.tsx` (inverted: count + freshness + Live/Offline chip + feat/fix/other tally), `commit-detail-sheet.tsx` (body + author/date/SHA + "View on GitHub" `Linking.openURL`). `filter-chips-bar.tsx` unchanged. `tsc` clean; `expo export -p ios` OK (5.5 MB). Uncommitted.**
35. [x] **Customers / Directors — wire real join data** (3.10). **Done — `customers/joins.ts` joins the detail view's Orders + Invoices to the live Sales / Billing collections by customer name (seed arrays kept as fallback for unmatched accounts). Directors carries no joinable data (static company/org reference content) — nothing to wire there. `tsc` clean; `expo export -p ios` OK (5.5 MB).** _(2026-08-27)_
36. **Push notification handlers** — task assigned / budget decided / message / dispatch (2.6).
37. **Rewards / points leaderboard** (3.11) — if in scope.
38. **Full `npx tsc --noEmit` + device run-through** (BUILD_PLAN Phase 9).

### Phase F — Nepal IRD compliance (own track, see `NEPAL_COMPLIANCE_PLAN.md`)
39. Invoice lifecycle: draft→issued immutability, no deletes, credit notes, per-FY counters, backdated-entry restriction.
40. IRD registers & VAT return reports (Sales / Purchase / Return / cancellation registers).
41. Audit trail (server-side, needs Firebase Blaze + Cloud Functions).
42. CBMS real-time sync (server-side, needs IRD registration).
43. Payroll: income-tax slabs, SSF/CIT/gratuity, Nepali-FY leave engine.

---

## 6. Live Firestore schema (the real data-model target)

Read directly from the reference app's production database (`kazi-manufacturing`) via `key.json` on 2026-08-26 — **30 top-level collections**. Field names below are the actual stored keys (they differ from both the reference `.jsx` variable names and the mobile mock shapes). When wiring a module, sample its collection again for current shape.

| Collection | Feeds mobile screen | Actual fields (from live docs) |
|---|---|---|
| `users` | Auth, Admin Panel | `uid, name, email, role, jobRole, location, permissions{section:bool}, createdAt` — override objects are real, e.g. `{tasks:true,production:true,qc:true,inventory:true,attendance:true}` |
| `employees` | Employees & HR | `id, name, email, role, appRole, department, location, status, isProductionWorker, reportsTo, basicSalaryNPR, bankName, bankAccount, bankBranch, panNumber, phone, address, joinDate, createdAt, updatedAt, updatedBy` — `reportsTo` exists → org chart is buildable |
| `finance_expenses` | Finance · Expenses | `category, amountNPR, date, note, vatBill (bool), status ("Paid"), loggedBy, createdAt` |
| `finance_purchases` | Finance · Purchases / Purchases | `expenseId ("EXP179"), expenseItem, category, paymentType ("CASH"/"Bank"), bankName, vatBill, discountAmt, taxableAmt, subtotalNPR, vatAmountNPR, amountNPR, date, items[] ({particulars, quantity, unit, rate, amount}), createdAt` |
| `finance_payroll` | Employees & HR · Payroll | `staffId, staffName, role, month, year, basicNPR, salaryNPR, overtimeNPR, bonusNPR, grossNPR, netNPR, deductionNPR, pfDeductionNPR, lateDays, lateCutsNumber, lateRateNPR, lateDeductionNPR, lateSalaryCutDeduction, totalDeductionsNPR, note, loggedBy, createdAt` |
| `journal_entries` | Finance · Journal / Accounting | `date, description, debitAccount (name), creditAccount (name), amountNPR, reference, createdBy, createdAt` — no `partyName` seen live |
| `accounts` | Finance · Ledger / Accounting | `name, type (Asset/Liability/Equity/Income/Expense), createdAt` — **no `openingBalanceNPR` stored** (reference backfills it; mobile must add it) |
| `bank_transactions` | Finance · Bank | `date ("2026-07-31 20:01"), type ("Debit"/"Credit"), amount, balance (running, from feed), remarks, timestamp, createdAt` — populated by the real eSewa/Fonepay webhook; `balance` is authoritative |
| `counters` | Billing numbering | single doc: `{nextInvoice: 50, nextQuotation: 24}` — **global, not per-fiscal-year** (compliance gap, item 39) |
| `invoices` | Billing | `invoiceNumber ("INV-028"), date, dueDate, fiscalYear ("2082/83"), clientName, clientPAN, clientPhone, clientAddress, status (Draft/Sent/Paid/Partial/Cancelled), applyVAT, currency (NPR/GBP), paymentTerms, items (⚠️ sometimes a JSON **string**, sometimes an array — normalise on read), discountPct, discountAmtNPR, subtotalNPR, taxableAmtNPR, vatAmountNPR, totalNPR, amountPaid, relatedChallan, relatedQuotation, note, createdBy/At, updatedBy/At` |
| `quotations` | Billing | like `invoices` + `quotationNumber ("QT-013"), validUntil, terms, relatedInvoice`; `currency` NPR **or** GBP |
| `orders` | Order Management / Production / Sales | `orderId ("ORD-051"), customerName, styleName, quantity, stage (from `stage_config`), status ("Active"), priority, date, deliveryDate, assignedTo, pricePerPcNPR, totalValueNPR, fabricType, fabricGramsUsed, fabricCostPerPcNPR, materialCostTotalNPR, colorway, sampleId, sampleName, invoiceRef, notes, notesList (JSON string), stageHistory (JSON string), createdBy, createdAt` — **the single orders source of truth** |
| `production` | Production · batches | `batchId ("B001"), date, cut, stitched, passed, rejected, note, loggedBy, createdAt` — counts per stage, no stage string; QC pass-rate derives from `passed/(passed+rejected)` |
| `qc_logs` | Quality Control | `qcId ("QC001"), batchId, date, inspected, passed, rejected, defectType, action, checkedBy, createdAt` |
| `inventory` | Inventory · Stock | `itemId ("#kazi1009"), item, category, unit, supplier, location, openingStock, minLevel, unitCostNPR, owner, condition, createdBy, createdAt` — **no running `qty` field**; live stock = `openingStock` ± movements (and there is no `stock_movements` collection — see discrepancies) |
| `fabrics` | Inventory · Library | `name, type, gsm, composition, weight, status ("In Stock"/"Out of Stock"), swatchImageUrl (⚠️ base64 data-URI in the doc), createdAt, updatedAt` |
| `processes` | Inventory · Library | `name, category, description, cost_per_unit, lead_time_days, min_quantity, available_colors, sizes_available[], notes, createdAt, updatedAt` |
| `patterns` | Inventory · Library (tech packs) | `name, styleNo ("#KAZI001"), product_type, category, designerName, season, market, sizes_available[], available_colors, trims, washCare, remarks, notes, specDate, specSize, measurements[], fabricRows[] ({fabricName, description}), frontSketchUrl / backSketchUrl (⚠️ base64), tech_pack_url (⚠️ base64), tech_pack_images (⚠️ JSON string of base64 array), createdAt, updatedAt` — **no `samples` collection live**; samples may be folded into `patterns` |
| `customers` | Customers | `name, contactPerson, email, phone, country, city, address, notes, createdAt` — no `type`/`terms` live (mobile adds them) |
| `tasks` | Tasks | `title, description, status, assignee, priority ("med"), dueDate, category, customer, orderRef, notes, createdBy, createdAt` |
| `task_columns` | Tasks | `label, order, tone ("neutral"/"mint")` |
| `budget_requests` | Budget & Requirements | `type ("budget"/"requirement"), title, category, amount (GBP), amountNPR, quantity, urgency (Low/Medium/High), status (Pending/Approved/Rejected), notes, requestedBy, requestedByRole, reviewedBy?, createdAt` — no `brId` stored in samples (generated in UI) |
| `attendance` | Attendance (daily record) | `staffId, staffName, role, date, status ("Present"/"Late"), hours, note, loggedBy, createdAt` |
| `clock_ins` | Attendance (GPS punches) | `staffId, staffName, role, date, clockedInAt, lat, lng, accuracyM, distanceToSiteM` — **real geofence data already flowing**; use it as the schema for item 26 |
| `content` | (undesigned) Content Calendar 4.2 | `date, platform ("Instagram"/"TikTok"), contentType ("Reel"/"Short Video"), topic, status (Draft/Pending Approval/Posted), createdBy, createdAt` |
| `content_calendar` | Marketing (3.14) | `title, type ("Shoot"/"Publish"), scheduledDate, timeSlot, mediaUrl, status ("scheduled"), notes, createdAt` — **distinct from `content`**; likely what mobile Marketing maps to |
| `messages` | Messenger | `senderId, text, timestamp` — only test data live; thread model TBD (item 31) |
| `stage_config` | Admin Panel / Production / Orders | `stage, order (0–8), enabled (bool), timeoutHours, workerNames[], workerUids[]` — 8-stage chain, some disabled |
| `product_costs` | Dashboard / Finance Order P&L | `code ("kazi1001"), name, fabric, rib, trims, labour, others, total, updatedAt` — per-style standard cost |
| `unit_economics` | Finance / Order P&L (target margin) | `fabric, rib, trims, directLabour, others, targetPrice, updatedBy, updatedAt` |

**Not present as collections** (empty or never created — treat as "design intent", not live schema): `challans`, `vat_bills`, `order_costs`, `order_assignments`, `stock_movements`, `user_points` (rewards), `bug_reports` (net-new for item 33). Their existence in the reference `.jsx` doesn't mean they hold data — confirm before depending on one.

### Live-vs-reference discrepancies to design around

- **Images stored as base64 data-URIs inside Firestore docs** (`fabrics.swatchImageUrl`, `patterns.*SketchUrl` / `tech_pack_*`). Fetching one pattern doc can pull megabytes. The mobile Library (items 20–21) should **migrate these to Firebase Storage** (store `{url, path}`) or at minimum lazy-load images out of the list query. Flag this to the user — it's a shared-backend change, so it needs coordination with the web app.
- **Invoice numbering is a single global `counters` doc**, not per-fiscal-year — so gap-free per-FY numbering (item 39) is a real migration, not just a UI change.
- **`invoices.items` / `orders.notesList` / `orders.stageHistory` are sometimes JSON strings**, sometimes native arrays. Every read path needs a `typeof x === 'string' ? JSON.parse(x) : x` guard.
- **`accounts` has no opening balance stored** and **there is no `stock_movements` collection** — the Finance Ledger running-balance tables (item 8) and Inventory stock levels (item 19) must be computed from primary docs (`finance_purchases`, paid `invoices`, `bank_transactions`, `journal_entries` for cash/bank; `inventory.openingStock` ± derived movements for stock), matching how the reference `Finance.jsx` `cashBankLedger` memo already does it. _(Re-checked 2026-08-30: `accounts` is now **114 live docs** — many user-created duplicates/variants, not the reference's clean 26. Item 8's swap must dedupe by `name` and tolerate the sprawl.)_
- **`content` and `content_calendar` both exist** — decision #4 (Marketing vs Content) is really "keep both, they're already separate collections" unless the user wants a merge.
- **No `user_points` collection** → rewards/leaderboard (item 37) is likely dead in production. Default it **out** unless the user says otherwise.
- **`production` batches store `cut/stitched/passed/rejected` counts**, not a stage; the 8-stage pipeline lives on `orders.stage` + `stage_config`. Don't conflate batch progress with order stage.

Server-side (out of scope now, listed for completeness): `firestore.rules`, `functions/` (Cloud Functions), `bank-webhook-worker` (Cloudflare Worker feeding `bank_transactions`).

---

## 7. Decisions needed from the user before starting

1. **Backend now or later?** Track A (finish screens on mock) then Track B (Firebase), or Firebase-first? Firebase project config needed either way for Track B.
2. ~~**Accounting vs Finance**~~ — **resolved (item 12): (a)** — standalone Accounting kept as `<Finance variant="accounting" />`, the journal/ledger/P&L/BS subset on shared data.
3. ~~**Sales vs Order Management vs Production orders**~~ — **resolved 2026-08-30 (item 22): Order Management owns `orders` CRUD, Production consumes + logs output, Sales is a read-only overview.** Data lives in `src/data/sales/` (kept for import stability).
4. **Marketing vs Content Calendar** — the live DB already has **two separate collections** (`content_calendar` = Marketing's Shoot/Publish calendar; `content` = the Instagram/TikTok publishing-approval workflow). Keep both as-is, or merge? Default: keep both.
5. **Design-first modules** — for Finance's 9 tabs, Billing's forms, Inventory Library, Order Management, Content, and the 2 extra Dashboard variants: create Claude Design screens first, or build directly from the reference source with the existing style tokens?
6. **Compliance scope** — is Nepal IRD compliance (Phase F) in scope for this build, or a later project? It's ~5 phases of mostly server-side work.
7. **Rewards / points leaderboard** and **Telegram relay** — in or out? (Live DB has **no `user_points` collection** → rewards looks dead in production. Recommend both **out** unless you want them.)
8. **Changelog** — live GitHub commits feed, or curated static list?
9. **Per-role tab sets** (2.9) — confirm the exact 4 destinations for each role's bottom bar (accountant / admin / UK director / Nepal ops / floor employee). Draft sets are in 2.9; sign off or adjust. Also: fixed 5 slots always ending in More — agreed?
