import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { useInvoices } from '@/data/billing/hooks';
import { useAddCustomer, useCustomers, useDeleteCustomer, useRestoreCustomers, useUpdateCustomer } from '@/data/customers/hooks';
import { invoicesForCustomer, ordersForCustomer } from '@/data/customers/joins';
import { blankDraft } from '@/data/customers/mock';
import type { Customer, CustomerDraft, CustomersFilter, CustomersView } from '@/data/customers/types';
import { owed } from '@/data/customers/utils';
import { useOrders } from '@/data/sales/hooks';

import { ConfirmDeleteSheet } from './confirm-delete-sheet';
import { CustomerForm } from './customer-form';
import { CustomerRow } from './customer-row';
import { DetailView } from './detail-view';
import { FormHeader } from './form-header';
import { ListSummary } from './list-summary';

export function Customers() {
  const theme = useTheme();
  const toast = useToast();

  const { data: customers } = useCustomers();
  const { data: salesOrders } = useOrders();
  const { data: billingInvoices } = useInvoices();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const restoreCustomers = useRestoreCustomers();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomersFilter>('all');
  const [view, setView] = useState<CustomersView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  if (!customers) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const q = query.trim().toLowerCase();
  let rows = customers;
  if (filter === 'company') rows = rows.filter((c) => c.type === 'company');
  else if (filter === 'person') rows = rows.filter((c) => c.type === 'person');
  else if (filter === 'owing') rows = rows.filter((c) => owed(c) > 0);
  if (q) rows = rows.filter((c) => `${c.name} ${c.contact} ${c.city} ${c.country}`.toLowerCase().includes(q));
  rows = rows.slice().sort((a, b) => a.name.localeCompare(b.name));

  const filters: { id: CustomersFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: customers.length },
    { id: 'company', label: 'Companies', count: customers.filter((c) => c.type === 'company').length },
    { id: 'person', label: 'Individuals', count: customers.filter((c) => c.type === 'person').length },
    { id: 'owing', label: 'Owing', count: customers.filter((c) => owed(c) > 0).length },
  ];

  const selected = customers.find((c) => c.id === selectedId) ?? null;
  const pending = customers.find((c) => c.id === pendingId) ?? null;

  // Item 35 — join the detail view's history to the live Sales + Billing collections
  // by customer name; fall back to the seed arrays when nothing matches.
  let detailCustomer = selected;
  if (selected) {
    const liveOrders = salesOrders ? ordersForCustomer(salesOrders, selected.name) : [];
    const liveInvoices = billingInvoices ? invoicesForCustomer(billingInvoices, selected.name) : [];
    if (liveOrders.length || liveInvoices.length) {
      detailCustomer = {
        ...selected,
        orders: liveOrders.length ? liveOrders : selected.orders,
        invoices: liveInvoices.length ? liveInvoices : selected.invoices,
      };
    }
  }
  const totalOwed = customers.reduce((n, c) => n + owed(c), 0);
  const nameOk = draft ? draft.name.trim().length > 1 : false;

  const flash = (message: string, before: Customer[]) => {
    toast.show({ message, tone: 'ok', action: { label: 'Undo', onPress: () => restoreCustomers.mutate(before) } });
  };

  const openDetail = (id: string) => {
    setSwipeOpenId(null);
    setView('detail');
    setSelectedId(id);
  };
  const backToList = () => {
    setView('list');
    setSelectedId(null);
  };

  const startAdd = () => {
    setSwipeOpenId(null);
    setDraft({ ...blankDraft });
    setEditingId(null);
    setTouched(false);
    setView('form');
  };
  const startEdit = () => {
    if (!selected) return;
    setDraft({
      type: selected.type,
      name: selected.name,
      contact: selected.contact,
      role: selected.role,
      email: selected.email,
      phone: selected.phone,
      city: selected.city,
      country: selected.country,
      address: selected.address,
      terms: selected.terms,
    });
    setEditingId(selected.id);
    setTouched(false);
    setView('form');
  };
  const cancelForm = () => {
    setView(editingId ? 'detail' : 'list');
    setDraft(null);
    setEditingId(null);
  };
  const patchDraft = (patch: Partial<CustomerDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const handleSave = () => {
    if (!draft) return;
    if (!nameOk) {
      setTouched(true);
      return;
    }
    const before = customers;
    if (editingId) {
      updateCustomer.mutate({ id: editingId, updates: { ...draft } });
      setView('detail');
      setSelectedId(editingId);
      setDraft(null);
      setEditingId(null);
      flash(`${draft.name.trim()} updated`, before);
    } else {
      const id = `n${Date.now()}`;
      const entry: Customer = {
        ...draft,
        id,
        name: draft.name.trim(),
        contact: draft.contact.trim() || draft.name.trim(),
        role: draft.role.trim() || 'Primary contact',
        since: 'Added today',
        orders: [],
        invoices: [],
      };
      addCustomer.mutate(entry);
      setView('list');
      setDraft(null);
      setEditingId(null);
      setFilter('all');
      setQuery('');
      flash(`${entry.name} added to the book`, before);
    }
  };

  const askDelete = (id: string) => setPendingId(id);
  const cancelDelete = () => {
    setSwipeOpenId(null);
    setPendingId(null);
  };
  const confirmDelete = () => {
    if (!pending) return;
    const before = customers;
    deleteCustomer.mutate(pending.id);
    setPendingId(null);
    setSwipeOpenId(null);
    setView('list');
    setSelectedId(null);
    setDraft(null);
    setEditingId(null);
    flash(`${pending.name} deleted`, before);
  };

  const pendingWarning = pending
    ? pending.orders.length
      ? `${pending.orders.length} open order(s) and ${pending.invoices.length} invoice(s) stay in the ledger — only the contact record is removed.`
      : `${pending.invoices.length} invoice(s) stay in the ledger — only the contact record is removed.`
    : '';

  if (view === 'form' && draft) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <FormHeader
          title={editingId ? 'Edit customer' : 'New customer'}
          saveLabel="Save"
          saveEnabled={nameOk}
          onCancel={cancelForm}
          onSave={handleSave}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <CustomerForm draft={draft} touched={touched} nameOk={nameOk} isEditing={!!editingId} onChange={patchDraft} onDelete={() => editingId && askDelete(editingId)} />
        </ScrollView>
        <ConfirmDeleteSheet visible={!!pending} name={pending?.name ?? ''} warning={pendingWarning} onCancel={cancelDelete} onConfirm={confirmDelete} />
      </View>
    );
  }

  if (view === 'detail' && selected && detailCustomer) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader
          title={selected.name}
          subtitle={selected.type === 'company' ? `${selected.city} · ${selected.terms}` : `Individual · ${selected.city}`}
          onBack={backToList}
          rightSlot={
            <Pressable onPress={startEdit} style={[styles.editButton, { borderColor: theme.scheme === 'light' ? '#CFD8D2' : theme.border, backgroundColor: theme.surface }]}>
              <Icon name="edit-2" size={13} color={theme.textPrimary} />
            </Pressable>
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <DetailView customer={detailCustomer} onDelete={() => askDelete(selected.id)} />
        </ScrollView>
        <ConfirmDeleteSheet visible={!!pending} name={pending?.name ?? ''} warning={pendingWarning} onCancel={cancelDelete} onConfirm={confirmDelete} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Customers"
        subtitle={`${customers.length} accounts · KTM + LDN book`}
        rightSlot={
          <Pressable onPress={startAdd} style={[styles.addButton, { backgroundColor: theme.accent, boxShadow: theme.scheme === 'light' ? '0 6px 16px -10px rgba(20,122,87,0.9)' : undefined }]}>
            <Icon name="plus" size={18} color={theme.accentText} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ListSummary
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          activeFilter={filter}
          onFilterChange={(f) => {
            setSwipeOpenId(null);
            setFilter(f);
          }}
          totalCount={customers.length}
          splitLabel={`${customers.filter((c) => c.type === 'company').length} co · ${customers.filter((c) => c.type === 'person').length} ind`}
          owedTotal={totalOwed ? `£${totalOwed.toLocaleString()}` : '£0'}
          hasOwed={totalOwed > 0}
        />

        {rows.length === 0 ? (
          <EmptyState
            icon="users"
            title="No customer matches"
            message={q ? `Nothing matches "${query.trim()}". Try a city, or clear the search.` : 'This filter is empty right now.'}
          />
        ) : (
          rows.map((c, i) => (
            <CustomerRow
              key={c.id}
              customer={c}
              index={i}
              isOpen={swipeOpenId === c.id}
              onSwipeOpen={() => setSwipeOpenId(c.id)}
              onSwipeClose={() => setSwipeOpenId(null)}
              onPress={() => openDetail(c.id)}
              onDelete={() => askDelete(c.id)}
            />
          ))
        )}
      </ScrollView>

      <ConfirmDeleteSheet visible={!!pending} name={pending?.name ?? ''} warning={pendingWarning} onCancel={cancelDelete} onConfirm={confirmDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 12, paddingBottom: 32, gap: 12 },
  addButton: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  editButton: { height: 34, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
