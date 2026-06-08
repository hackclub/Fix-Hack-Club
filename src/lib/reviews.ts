// Pre-made rejection reasons used when denying a submission — shared by the
// first-grade reviewer and the final admin review. The first entry is the
// default selection in the review forms.
export const REJECTION_REASONS = [
  'Not sufficient changes',
  'Waiting on PR to be merged',
  'Out of scope — not an approved project',
  'Needs more detail in the devlog or notes',
  "Doesn't follow the contribution guidelines",
] as const;

// Two-stage review workflow. A submission stays in `status: 'Submitted'` for the
// whole review period; `reviewStage` tracks where it is:
//   - 'first': awaiting the first-grade review (a reviewer or an admin)
//   - 'final': a reviewer recommended approve/deny; awaiting the final admin call
export const REVIEW_STAGE = {
  FIRST: 'first',
  FINAL: 'final',
} as const;

export type ReviewStage = (typeof REVIEW_STAGE)[keyof typeof REVIEW_STAGE];
