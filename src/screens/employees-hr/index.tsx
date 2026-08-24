import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar, tintFromSeed } from '@/components/ui/avatar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { useAddEmployee, useApprovals, useApproveMonth, useEmployees, useUpdateEmployee } from '@/data/employees-hr/hooks';
import { BANKS, DEPTS, MONTHS } from '@/data/employees-hr/mock';
import { inWords, maskAccount, npr, num, pay } from '@/data/employees-hr/utils';
import type { Employee, EmployeeDraft, EmployeeView, MonthKey, SheetMode } from '@/data/employees-hr/types';

import { DirectoryView } from './directory-view';
import { EmployeeSheet } from './employee-sheet';
import { PayrollView, type RunPillState } from './payroll-view';
import type { RecordRowModel } from './record-row';
import { SalarySlip, type SlipData } from './salary-slip';
import { TabsHeader } from './tabs-header';

const AUG = MONTHS[0];

function blankDraft(): EmployeeDraft {
  return { id: null, name: '', role: '', dept: 'Sewing', bank: BANKS[0], acct: '', branch: '', basic: '', active: true };
}
function draftFrom(p: Employee): EmployeeDraft {
  return { id: p.id, name: p.name, role: p.role, dept: p.dept, bank: p.bank, acct: p.acct, branch: p.branch, basic: num(p.basic), active: p.active };
}

export function EmployeesHR() {
  const theme = useTheme();
  const toast = useToast();

  const { data: employees } = useEmployees();
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const { data: approvals } = useApprovals();
  const approveMonth = useApproveMonth();

  const [view, setView] = useState<EmployeeView>('directory');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [monthKey, setMonthKey] = useState<MonthKey>('aug');
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [draft, setDraft] = useState<EmployeeDraft>(blankDraft());
  const [slipId, setSlipId] = useState<number | null>(null);

  if (!employees || !approvals) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const month = MONTHS.find((m) => m.key === monthKey) ?? AUG;
  const approved = !!approvals[month.key];
  const runOpen = month.open && !approved;

  const active = employees.filter((e) => e.active);
  const netTotal = active.reduce((n, p) => n + pay(p, AUG).net, 0);

  const q = query.trim().toLowerCase();
  const matches = (p: Employee) => !q || `${p.name} ${p.role} ${p.code} ${p.dept}`.toLowerCase().includes(q);
  const inFilter = (p: Employee) => filter === 'all' || (filter === 'active' && p.active) || (filter === 'inactive' && !p.active) || filter === p.dept;
  const list = employees.filter((p) => matches(p) && inFilter(p));

  const filterDefs = [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'inactive', label: 'Inactive' }].concat(
    DEPTS.filter((d) => employees.some((p) => p.dept === d)).map((d) => ({ id: d, label: d })),
  );
  const filters = filterDefs.map((f) => ({
    id: f.id,
    label: f.label,
    count: employees.filter((p) => matches(p) && (f.id === 'all' || (f.id === 'active' && p.active) || (f.id === 'inactive' && !p.active) || f.id === p.dept)).length,
  }));

  const recPeople = employees.filter((p) => p.active || month.key !== 'aug');
  const runRows = recPeople.map((p) => ({ p, r: pay(p, month) }));
  const runGross = runRows.reduce((a, x) => a + x.r.gross, 0);
  const runDed = runRows.reduce((a, x) => a + x.r.ded, 0);
  const employerSsf = runRows.reduce((a, x) => a + Math.round((x.p.basic + x.p.allow) * 0.2), 0);
  const recordIsPaid = month.open ? approved : true;
  const runPillState: RunPillState = month.open ? (approved ? 'approved' : 'draft') : 'paid';

  const slipPerson = slipId ? employees.find((p) => p.id === slipId) : null;
  const slipPay = slipPerson ? pay(slipPerson, month) : null;

  const openAdd = () => {
    setDraft(blankDraft());
    setSheet('add');
  };
  const openEdit = (id: number) => {
    const p = employees.find((e) => e.id === id);
    if (!p) return;
    setDraft(draftFrom(p));
    setSheet('edit');
  };
  const closeSheet = () => setSheet(null);

  const handleSave = () => {
    if (!draft.name.trim()) return;
    const basic = parseInt(draft.basic.replace(/[^0-9]/g, ''), 10) || 18600;

    if (draft.id) {
      const existing = employees.find((p) => p.id === draft.id);
      updateEmployee.mutate({
        id: draft.id,
        updates: { name: draft.name.trim(), role: draft.role.trim() || existing?.role, dept: draft.dept, bank: draft.bank, acct: draft.acct, branch: draft.branch, basic, active: draft.active },
      });
    } else {
      const maxCode = employees.reduce((a, p) => Math.max(a, parseInt(p.code.slice(3), 10)), 0);
      const parts = draft.name.trim().split(/\s+/);
      const initials = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
      addEmployee.mutate({
        id: Date.now(),
        code: `KZ-${String(maxCode + 4).padStart(4, '0')}`,
        name: draft.name.trim(),
        role: draft.role.trim() || `${draft.dept} operator`,
        dept: draft.dept,
        active: draft.active,
        joined: '23 Aug 2026',
        bank: draft.bank,
        acct: draft.acct,
        branch: draft.branch || 'Balaju',
        basic,
        allow: Math.round(basic * 0.1),
        otH: 0,
        otR: 160,
        bonus: 900,
        adv: 0,
        absent: 0,
        late: 0,
        tax: 0,
        avatarInitials: initials,
        avatarTint: tintFromSeed(initials),
      });
    }
    setSheet(null);
    toast.show({ message: draft.id ? `${draft.name.trim()} · record updated` : `${draft.name.trim()} added to the directory`, tone: 'ok' });
  };

  const approveRun = () => {
    const slipsCount = runRows.length;
    approveMonth.mutate(month.key);
    toast.show({ message: `${month.label.split(' ')[0]} run approved · ${slipsCount} slips generated`, tone: 'ok' });
  };
  const exportBankFile = () => toast.show({ message: `Transfer file exported · 4 banks, ${runRows.length} credits`, tone: 'ok' });

  const openSlip = (id: number) => setSlipId(id);
  const closeSlip = () => setSlipId(null);
  const emailSlip = () => {
    toast.show({ message: `Slip emailed · ${slipPerson ? slipPerson.name.split(' ')[0] : ''} and a copy to HR`, tone: 'ok' });
  };
  const downloadSlip = () => {
    toast.show({ message: `Downloaded ${slipPerson ? slipPerson.code : ''} · ${month.label}`, tone: 'ok' });
  };

  let slipData: SlipData | null = null;
  if (slipPerson && slipPay) {
    const earnings = [
      { label: 'Basic salary', note: `${month.days} working days`, value: num(slipPerson.basic) },
      { label: 'Grade allowance', note: `grade ${slipPerson.dept.toLowerCase()}`, value: num(slipPerson.allow) },
      { label: 'Overtime', note: `${slipPay.otHours}h @ NPR ${slipPerson.otR}/hr`, value: num(slipPay.ot) },
      { label: 'Attendance & festival allowance', note: 'Dashain advance not included', value: num(slipPerson.bonus) },
    ].filter((e) => e.value !== '0');
    const deductions = [
      { label: 'SSF employee contribution', note: '11% of basic + allowance', value: num(slipPay.ssf) },
      { label: 'Salary advance recovery', note: '1 of 2 instalments', value: num(slipPerson.adv) },
      { label: 'Attendance deduction', note: `${slipPay.absent} absent · ${slipPay.late} late`, value: num(slipPay.cut) },
      { label: 'Social security tax', note: '1% statutory', value: num(slipPerson.tax) },
    ].filter((d) => d.value !== '0');
    const paidNow = month.open ? approved : true;

    slipData = {
      fileName: `payslip-${slipPerson.code}-${month.label.replace(' ', '').toLowerCase()}.pdf`,
      meta: `${month.period} · ${paidNow ? `paid ${month.payDate}` : 'pending approval'}`,
      ref: `PS/${slipPerson.code.slice(3)}/${month.label.split(' ')[0].toUpperCase()}26`,
      period: month.period,
      employeeName: slipPerson.name,
      employeeBlock: `${slipPerson.code}\n${slipPerson.role} · ${slipPerson.dept}\nJoined ${slipPerson.joined}${slipPerson.active ? '' : `\n${slipPerson.left ?? 'inactive'}`}`,
      paymentBlock: `${month.payDate}\n${slipPerson.bank} · ${slipPerson.branch}\n${maskAccount(slipPerson.acct)}\nPaid days ${month.days - slipPay.absent} of ${month.days}`,
      earnings,
      deductions,
      gross: num(slipPay.gross),
      totalDeductions: `− ${num(slipPay.ded)}`,
      net: npr(slipPay.net),
      words: `${inWords(slipPay.net)} rupees only`,
      footNote: `Employer SSF contribution NPR ${num(Math.round((slipPerson.basic + slipPerson.allow) * 0.2))} deposited separately under 09-1188-4471.\nAttendance figures are taken from the gate clock; corrections raised within 7 days are adjusted in the next run.`,
    };
  }

  const records: RecordRowModel[] = runRows.map((x) => ({
    id: x.p.id,
    name: x.p.name,
    initials: x.p.avatarInitials,
    tint: x.p.avatarTint,
    paidDays: `${month.days - x.r.absent}/${month.days} days`,
    dedLabel: x.r.ded > 0 ? `− ${num(x.r.ded)}` : 'no deductions',
    hasDeduction: x.r.ded > 0,
    net: num(x.r.net),
    state: recordIsPaid ? 'Paid' : 'Pending',
    isPaid: recordIsPaid,
  }));

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Employees" subtitle={`${employees.length} on roll · Balaju plant`} rightSlot={<Avatar initials="KA" tint="dark" size="lg" />} />
      <TabsHeader view={view} onChange={setView} />

      <ScrollView contentContainerStyle={styles.content}>
        {view === 'directory' ? (
          <DirectoryView
            activeCount={active.length}
            netPayrollTotal={npr(netTotal)}
            rollNote={`${employees.length - active.length} inactive · avg net ${npr(Math.round(netTotal / Math.max(active.length, 1)))}`}
            runStatusNote={approvals['aug'] ? 'Aug run approved' : 'Aug run open'}
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            activeFilter={filter}
            onFilterChange={setFilter}
            people={list.map((p) => ({ id: p.id, name: p.name, role: p.role, code: p.code, initials: p.avatarInitials, tint: p.avatarTint, active: p.active }))}
            onOpenPerson={openEdit}
            onAdd={openAdd}
          />
        ) : (
          <PayrollView
            months={MONTHS.map((m) => ({ key: m.key, label: m.label, state: m.open ? (approvals[m.key] ? 'approved' : 'draft') : 'paid' }))}
            activeMonth={monthKey}
            onMonthChange={setMonthKey}
            runTitle={`Payroll run · ${month.label}`}
            runPillState={runPillState}
            runGross={npr(runGross)}
            runDeductions={`− ${npr(runDed)}`}
            runNet={npr(runGross - runDed)}
            runMeta={`${runRows.length} staff · ${month.days} working days · pay date ${month.payDate}`}
            runOpen={runOpen}
            approveLabel={`Approve run · generate ${runRows.length} slips`}
            onApprove={approveRun}
            onExportBankFile={exportBankFile}
            recordCount={`${runRows.length} · ${month.label}`}
            records={records}
            onOpenSlip={openSlip}
            employerNote={`${npr(employerSsf)} payable to SSF for ${month.label} · deposit by the 15th of the following month`}
          />
        )}
      </ScrollView>

      <EmployeeSheet
        visible={sheet !== null}
        mode={sheet}
        draft={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        onClose={closeSheet}
        onSave={handleSave}
        sheetMeta={sheet === 'edit' ? `${draft.dept} · joined ${employees.find((p) => p.id === draft.id)?.joined ?? ''}` : 'New record · Balaju plant'}
        saveHint={sheet === 'edit' ? 'Changes apply from the next run' : 'Added to the current month'}
        saveCode={sheet === 'edit' ? (employees.find((p) => p.id === draft.id)?.code ?? '') : 'KZ-next'}
        onViewSlip={() => draft.id && openSlip(draft.id)}
      />

      <SalarySlip visible={slipId !== null} slip={slipData} onClose={closeSlip} onEmail={emailSlip} onDownload={downloadSlip} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 110, gap: 16 },
});
