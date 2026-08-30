import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import {
  useAddStockItem,
  useLibrary,
  usePostStockMovement,
  useRestoreInventory,
  useStock,
  useStockMovements,
  useUpdateStockItem,
} from '@/data/inventory/hooks';
import { stockLevel } from '@/data/inventory/utils';
import type { LibraryItem, StockDetailsDraft, StockItem, StockMovementDraft } from '@/data/inventory/types';

import { AddSheet, type AddDraft, type UploadEntry } from './add-sheet';
import { AdjustSheet } from './adjust-sheet';
import { DetailView } from './detail-view';
import { EditSheet } from './edit-sheet';
import { ListHeader, type InventoryFilter, type InventoryTab } from './list-header';
import { LibraryGroup } from './library-row';
import { StockRow } from './stock-row';

function emptyDraft(): AddDraft {
  return { name: '', qty: '', threshold: '', unit: 'm', kind: 'Sketch', note: '' };
}

function emptyMovementDraft(): StockMovementDraft {
  return { kind: 'out', qty: '', reason: '', ref: '' };
}

export function Inventory() {
  const theme = useTheme();
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can('inventory');

  const { data: stock } = useStock();
  const { data: library } = useLibrary();
  const { data: movements } = useStockMovements();
  const addStockItem = useAddStockItem();
  const postMovement = usePostStockMovement();
  const updateStockItem = useUpdateStockItem();
  const restoreInventory = useRestoreInventory();

  const [tab, setTab] = useState<InventoryTab>('inventory');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<AddDraft>(emptyDraft());
  const [uploads, setUploads] = useState<UploadEntry[]>([]);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [moveDraft, setMoveDraft] = useState<StockMovementDraft>(emptyMovementDraft());
  const [editOpen, setEditOpen] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState<StockDetailsDraft>({ threshold: '', lead: '', location: '', cost: '', supplier: '' });

  if (!stock || !library || !movements) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const isFabric = tab === 'inventory';
  const q = query.trim().toLowerCase();
  const lowItems = stock.filter((s) => stockLevel(s) === 'low');
  const selectedItem = stock.find((s) => s.id === selectedId) ?? null;

  const filters: { id: InventoryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stock.length },
    { id: 'low', label: 'Below reorder', count: lowItems.length },
    { id: 'fabric', label: 'Fabric', count: stock.filter((s) => s.sku.startsWith('FAB')).length },
    { id: 'trim', label: 'Trims', count: stock.filter((s) => s.sku.startsWith('TRM')).length },
  ];

  let rows = stock;
  if (filter === 'low') rows = rows.filter((s) => stockLevel(s) === 'low');
  if (filter === 'fabric') rows = rows.filter((s) => s.sku.startsWith('FAB'));
  if (filter === 'trim') rows = rows.filter((s) => s.sku.startsWith('TRM'));
  if (q) rows = rows.filter((s) => `${s.name} ${s.sku} ${s.supplier}`.toLowerCase().includes(q));

  const libRows = q ? library.filter((l) => `${l.name} ${l.meta} ${l.tags.join(' ')}`.toLowerCase().includes(q)) : library;
  const libraryGroups: { title: string; items: LibraryItem[] }[] = [];
  libRows.forEach((l) => {
    let g = libraryGroups.find((x) => x.title === l.group);
    if (!g) {
      g = { title: l.group, items: [] };
      libraryGroups.push(g);
    }
    g.items.push(l);
  });

  const flash = (message: string) => toast.show({ message, tone: 'ok' });

  const openAdd = () => {
    if (!canEdit) return;
    setDraft(emptyDraft());
    setUploads([]);
    setStep(1);
    setAddOpen(true);
  };
  const closeAdd = () => setAddOpen(false);
  const patchDraft = (patch: Partial<AddDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleUpload = () => {
    setUploads((u) => [...u, { name: `${isFabric ? 'swatch' : 'sketch'}-${u.length + 1}.jpg`, meta: '1.4 MB · uploaded just now' }]);
  };
  const handleRemoveUpload = (index: number) => setUploads((u) => u.filter((_, i) => i !== index));

  const handleAddNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
      return;
    }
    const name = draft.name.trim() || (isFabric ? 'Untitled fabric' : 'Untitled item');
    if (isFabric) {
      const qty = parseInt(draft.qty, 10) || 0;
      const threshold = parseInt(draft.threshold, 10) || 0;
      const newItem: StockItem = {
        id: `new${Date.now()}`,
        name,
        sku: `FAB-NEW-${stock.length + 1}`,
        supplier: 'Unassigned',
        qty,
        threshold,
        unit: draft.unit,
        swatch: '#E7E9E2',
        swatchFg: '#3B4F47',
        swatchLabel: 'NEW',
        lead: '—',
        location: 'Unassigned',
        cost: '—',
        batches: '—',
      };
      addStockItem.mutate(newItem);
    }
    setAddOpen(false);
    flash(`${name} added${uploads.length ? ' with photo' : ''}`);
  };

  const openAdjust = () => {
    if (!canEdit) return;
    setMoveDraft(emptyMovementDraft());
    setAdjustOpen(true);
  };

  const handlePostMovement = () => {
    if (!selectedItem) return;
    const qty = parseInt(moveDraft.qty.replace(/[^0-9]/g, ''), 10) || 0;
    if (qty <= 0 && !(moveDraft.kind === 'adjust' && moveDraft.qty.trim() !== '')) {
      toast.show({ message: 'Enter a quantity', tone: 'bad' });
      return;
    }
    const beforeStock = stock;
    const beforeMoves = movements;
    postMovement.mutate({
      itemId: selectedItem.id,
      kind: moveDraft.kind,
      qty,
      reason: moveDraft.reason.trim(),
      ref: moveDraft.ref.trim(),
    });
    setAdjustOpen(false);
    const verb = moveDraft.kind === 'in' ? 'stocked in' : moveDraft.kind === 'out' ? 'issued' : 'adjusted';
    toast.show({
      message: `${selectedItem.name} · ${qty.toLocaleString()} ${selectedItem.unit} ${verb}`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => restoreInventory.mutate({ stock: beforeStock, movements: beforeMoves }) },
    });
  };

  const openEdit = () => {
    if (!selectedItem || !canEdit) return;
    setDetailsDraft({
      threshold: String(selectedItem.threshold),
      lead: selectedItem.lead,
      location: selectedItem.location,
      cost: selectedItem.cost,
      supplier: selectedItem.supplier,
    });
    setEditOpen(true);
  };

  const handleSaveDetails = () => {
    if (!selectedItem) return;
    const threshold = parseInt(detailsDraft.threshold.replace(/[^0-9]/g, ''), 10);
    updateStockItem.mutate({
      id: selectedItem.id,
      updates: {
        threshold: Number.isFinite(threshold) ? threshold : selectedItem.threshold,
        lead: detailsDraft.lead.trim() || selectedItem.lead,
        location: detailsDraft.location.trim() || selectedItem.location,
        cost: detailsDraft.cost.trim() || selectedItem.cost,
        supplier: detailsDraft.supplier.trim() || selectedItem.supplier,
      },
    });
    setEditOpen(false);
    flash(`${selectedItem.name} updated`);
  };

  if (selectedItem) {
    return (
      <>
        <DetailView
          item={selectedItem}
          movements={movements.filter((m) => m.itemId === selectedItem.id)}
          onBack={() => setSelectedId(null)}
          onRaisePO={() => flash(`PO draft started for ${selectedItem.sku}`)}
          onAdjust={canEdit ? openAdjust : undefined}
          onEditDetails={canEdit ? openEdit : undefined}
        />
        <AdjustSheet
          visible={adjustOpen}
          item={selectedItem}
          draft={moveDraft}
          onClose={() => setAdjustOpen(false)}
          onChange={(p) => setMoveDraft((d) => ({ ...d, ...p }))}
          onSubmit={handlePostMovement}
        />
        <EditSheet
          visible={editOpen}
          item={selectedItem}
          draft={detailsDraft}
          onClose={() => setEditOpen(false)}
          onChange={(p) => setDetailsDraft((d) => ({ ...d, ...p }))}
          onSubmit={handleSaveDetails}
        />
      </>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ListHeader
        tab={tab}
        onTabChange={(t) => {
          setTab(t);
          setQuery('');
        }}
        headerMeta={isFabric ? `${stock.length} items · ${lowItems.length} below reorder` : `${library.length} reference files · 3 groups`}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={isFabric ? 'Search fabric, trim or SKU…' : 'Search sketches, specs, lab dips…'}
        filters={isFabric ? filters : undefined}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <PermissionNotice section="inventory" />
        {isFabric ? (
          <>
            {lowItems.length > 0 && filter !== 'low' ? (
              <Pressable onPress={() => setFilter('low')} style={[styles.lowBanner, { backgroundColor: theme.dangerWash, borderColor: theme.scheme === 'light' ? '#E3C9BE' : theme.border }]}>
                <Icon name="alert-triangle" size={18} color={theme.dangerWashText} />
                <Text style={[styles.lowBannerText, { color: theme.dangerWashText }]}>
                  {lowItems.length} {lowItems.length === 1 ? 'item is' : 'items are'} below reorder threshold
                </Text>
                <Icon name="chevron-right" size={15} color={theme.dangerWashText} />
              </Pressable>
            ) : null}

            {rows.length === 0 ? (
              <EmptyState icon="search" title="Nothing matches" message={`Try a shorter search, or clear the filter to see all ${stock.length} items.`} />
            ) : (
              rows.map((item, index) => <StockRow key={item.id} item={item} index={index} onPress={() => setSelectedId(item.id)} />)
            )}
          </>
        ) : (
          libraryGroups.map((g) => (
            <LibraryGroup key={g.title} title={g.title} items={g.items} onOpen={(item) => flash(`${item.name} — preview opens full screen`)} />
          ))
        )}
      </ScrollView>

      {canEdit ? (
        <Pressable onPress={openAdd} style={[styles.fab, { backgroundColor: theme.surfaceInverted, boxShadow: theme.scheme === 'light' ? '0 16px 30px -16px rgba(13,31,25,0.85)' : undefined }]}>
          <Icon name="plus" size={18} color={theme.onDark.accent} />
          <Text style={[styles.fabLabel, { color: theme.onDark.text }]}>{isFabric ? 'Add fabric' : 'Add item'}</Text>
        </Pressable>
      ) : null}

      <AddSheet
        visible={addOpen}
        isFabric={isFabric}
        step={step}
        draft={draft}
        uploads={uploads}
        onClose={closeAdd}
        onChange={patchDraft}
        onUpload={handleUpload}
        onRemoveUpload={handleRemoveUpload}
        onBack={() => setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3)}
        onNext={handleAddNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 110, gap: 12 },
  lowBanner: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, borderWidth: 1, padding: 14 },
  lowBannerText: { flex: 1, fontSize: 13.5, lineHeight: 13.5 * 1.4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    height: 52,
    paddingLeft: 17,
    paddingRight: 20,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  fabLabel: { fontFamily: fontFamily.semibold, fontSize: 14.5 },
});
