import type { Submission } from '@prisma/client';

// The Unified YSWS "Projects" review format — exact column header and order as
// exported by the review program (Projects-Review.csv). Do not reorder or rename:
// the program ingests by these headers.
export const YSWS_COLUMNS = [
  'Code URL',
  'Playable URL',
  'Status',
  'How did you hear about this?',
  'What are we doing well?',
  'How can we improve?',
  'First Name',
  'Last Name',
  'Email',
  'Screenshot',
  'Description',
  'GitHub Username',
  'Address (Line 1)',
  'Address (Line 2)',
  'City',
  'State / Province',
  'Country',
  'ZIP / Postal Code',
  'Birthday',
  'Optional - Override Hours Spent',
  'Optional - Override Hours Spent Justification',
  'Automation - Submit to Unified YSWS',
  'Automation - Error',
  'Automation - First Submitted At',
  'Automation - YSWS Record ID',
  'Loops - Special - setFullName',
  'Loops - birthday',
  'Loops - Special - setFullAddress',
  'Time Taken',
] as const;

// Status is always "Pending Review" on export — the review program decides the
// rest downstream. (Confirmed with the user.)
const STATUS_VALUE = 'Pending Review';

function hoursFromSeconds(seconds: number): string {
  if (!seconds) return '';
  return String(Math.round((seconds / 3600) * 100) / 100);
}

function fullAddress(s: Submission): string {
  return [s.addressLine1, s.addressLine2, s.city, s.state, s.zip, s.country]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ');
}

// Map a submission to a single export row, in YSWS_COLUMNS order. Submitter and
// reviewer data come from the submission; Automation- columns are left blank for
// the review program's pipeline; Loops- columns and Time Taken are derived.
export function submissionToYswsRow(s: Submission): string[] {
  const fullName = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
  return [
    s.url ?? '', // Code URL
    s.playableUrl ?? '', // Playable URL
    STATUS_VALUE, // Status
    s.heardAbout ?? '', // How did you hear about this?
    s.reviewDoingWell ?? '', // What are we doing well?
    s.reviewImprove ?? '', // How can we improve?
    s.firstName ?? '', // First Name
    s.lastName ?? '', // Last Name
    s.email ?? '', // Email
    s.screenshotUrl ?? '', // Screenshot
    s.notes ?? '', // Description (reuses notes)
    s.githubUsername ?? '', // GitHub Username
    s.addressLine1 ?? '', // Address (Line 1)
    s.addressLine2 ?? '', // Address (Line 2)
    s.city ?? '', // City
    s.state ?? '', // State / Province
    s.country ?? '', // Country
    s.zip ?? '', // ZIP / Postal Code
    s.dateOfBirth ?? '', // Birthday
    s.overrideHours != null ? String(s.overrideHours) : '', // Optional - Override Hours Spent
    s.overrideHoursJustification ?? '', // Optional - Override Hours Spent Justification
    '', // Automation - Submit to Unified YSWS
    '', // Automation - Error
    '', // Automation - First Submitted At
    '', // Automation - YSWS Record ID
    fullName, // Loops - Special - setFullName
    s.dateOfBirth ?? '', // Loops - birthday
    fullAddress(s), // Loops - Special - setFullAddress
    hoursFromSeconds(s.loggedSeconds), // Time Taken
  ];
}

// RFC4180 minimal quoting: quote a field only if it contains a comma, double
// quote, or newline; escape embedded quotes by doubling them.
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// Serialize submissions into the Unified YSWS CSV: UTF-8 BOM, header row, then
// one row per submission, LF line endings (matching the source export).
export function buildYswsCsv(submissions: Submission[]): string {
  const rows = [YSWS_COLUMNS.map((c) => csvCell(c)).join(',')];
  for (const s of submissions) {
    rows.push(submissionToYswsRow(s).map(csvCell).join(','));
  }
  return '\uFEFF' + rows.join('\n') + '\n';
}
