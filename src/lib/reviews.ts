// Pre-made rejection reasons an admin can pick when rejecting a submission.
// The first entry is the default selection in the admin review form.
export const REJECTION_REASONS = [
  'Not sufficient changes',
  'Waiting on PR to be merged',
  'Out of scope — not an approved project',
  'Needs more detail in the devlog or notes',
  "Doesn't follow the contribution guidelines",
] as const;
