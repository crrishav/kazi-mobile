import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { PurchaseEntry } from '@/data/purchases/types';

import { DetailView } from './detail-view';

export interface PurchaseDetailSheetProps {
  visible: boolean;
  entry: PurchaseEntry | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
}

export function PurchaseDetailSheet({ visible, entry, canEdit, onClose, onEdit, onMarkPaid, onDelete }: PurchaseDetailSheetProps) {
  return (
    <BottomSheet visible={visible && !!entry} onClose={onClose} title={entry?.expenseId ?? 'Purchase'} maxHeight={760}>
      {entry ? (
        <DetailView entry={entry} canEdit={canEdit} onEdit={onEdit} onMarkPaid={onMarkPaid} onDelete={onDelete} />
      ) : null}
    </BottomSheet>
  );
}
