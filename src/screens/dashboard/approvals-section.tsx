import { useToast } from '@/components/toast/toast-provider';
import { useApprovals, useDecideApproval, useUndoApproval } from '@/data/approvals/hooks';
import type { ApprovalItem } from '@/data/approvals/types';

import { ApprovalsList } from './approvals-list';

/**
 * Self-contained "needs your approval" queue for the Ops / Director variants.
 * Still backed by the mock approvals store — wiring it to real `budget_requests`
 * is a follow-up.
 */
export function ApprovalsSection() {
  const toast = useToast();
  const { data: approvals } = useApprovals();
  const decideApproval = useDecideApproval();
  const undoApproval = useUndoApproval();

  const handleDecision = (item: ApprovalItem, index: number, decision: 'approve' | 'reject') => {
    decideApproval.mutate(item, {
      onSuccess: () => {
        toast.show({
          message: `${item.title} ${decision === 'approve' ? 'approved' : 'rejected'}`,
          tone: decision === 'approve' ? 'ok' : 'bad',
          action: {
            label: 'Undo',
            onPress: () => undoApproval.mutate({ item, index }),
          },
        });
      },
    });
  };

  return (
    <ApprovalsList
      items={approvals ?? []}
      onApprove={(item, index) => handleDecision(item, index, 'approve')}
      onReject={(item, index) => handleDecision(item, index, 'reject')}
    />
  );
}
