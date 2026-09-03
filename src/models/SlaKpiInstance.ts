export type SlaStatus = 'In Progress' | 'Noncompliant' | 'Nearing Noncompliance' | 'Succeeded' | 'Paused' | 'Canceled';
export type Priority = string;

export interface SlaKpiInstance {
  id: string;
  name: string;
  kpiId: string;
  kpiName: string;
  regardingId: string;
  regardingType: string;
  regardingNumber: string;
  regardingSubject: string;

  status: SlaStatus;
  failureTime?: string;
  warningTime?: string;
  succeededOn?: string;
  pausedOn?: string;
  lastResumedOn?: string;

  createdOn: string;
  modifiedOn: string;

  owner: string;
  team: string;
  priority: Priority;
  category: string;
  isCaseResolved?: boolean;

  // Computed/Formatted UI Helpers attached during mapping
  remainingTimeFormatted?: string;
  overdueDurationFormatted?: string;
  whyItMatters?: string;
  recommendedAction?: string;
  availableActions?: string[];
}
