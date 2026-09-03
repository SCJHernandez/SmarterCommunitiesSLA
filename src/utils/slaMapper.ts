import { DataverseSlaKpiInstance, SlaKpiInstance, Priority, SlaStatus } from '../models';
import { formatDistanceToNow, isPast, parseISO, differenceInMinutes } from 'date-fns';

const mapStatusCodeToStatus = (code: number): SlaStatus => {
  switch (code) {
    case 0: return 'In Progress';
    case 1: return 'Noncompliant';
    case 2: return 'Nearing Noncompliance';
    case 3: return 'Succeeded';
    case 4: return 'Paused';
    case 5: return 'Canceled';
    default: return 'In Progress';
  }
};

const mapPriorityCodeToPriority = (code: number): Priority => {
  switch (code) {
    case 1: return 'High';
    case 2: return 'Normal';
    case 3: return 'Low';
    default: return 'Normal';
  }
};

export const mapDataverseToDomain = (raw: any): SlaKpiInstance => {
  // If the backend already mapped to the target schema, use it directly, 
  // otherwise fallback to older mock data mapping
  const id = raw.id || raw.slakpiinstanceid;
  const status = raw.status || mapStatusCodeToStatus(raw.statuscode);
  
  let remainingTimeFormatted;
  let overdueDurationFormatted;
  
  const failureTimeStr = raw.failureTime || raw.failuretime;
  if (failureTimeStr) {
    const failureDate = parseISO(failureTimeStr);
    if (status === 'Nearing Noncompliance' || (status === 'In Progress' && !isPast(failureDate))) {
      const diffMins = differenceInMinutes(failureDate, new Date());
      remainingTimeFormatted = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
    } else if (status === 'Noncompliant') {
      overdueDurationFormatted = formatDistanceToNow(failureDate);
    }
  }

  let recommendedAction;
  if (status === 'Noncompliant') {
    recommendedAction = 'Escalate';
  } else if (status === 'Nearing Noncompliance') {
    recommendedAction = 'Review';
  }

  return {
    id,
    name: raw.name || raw.name,
    kpiId: raw.kpiId || raw._slakpiid_value,
    kpiName: raw.kpiName || raw.slakpiid_name,
    regardingId: raw.regardingId || raw._regardingobjectid_value,
    regardingType: raw.regardingType || raw.regardingobjectid_type,
    regardingNumber: raw.regardingNumber || raw.regardingobjectid_number,
    regardingSubject: raw.regardingSubject || raw.regardingobjectid_title,
    
    status,
    failureTime: failureTimeStr,
    warningTime: raw.warningTime || raw.warningtime,
    succeededOn: raw.succeededOn || raw.succeededon || undefined,
    createdOn: raw.createdOn || raw.createdon,
    modifiedOn: raw.modifiedOn || raw.modifiedon,
    
    owner: raw.owner || raw.ownerid_name,
    team: raw.team || raw.owningteam_name,
    priority: raw.priority || mapPriorityCodeToPriority(raw.prioritycode),
    category: raw.category !== undefined ? raw.category : raw.category, // safe empty string handling
    isCaseResolved: raw.isCaseResolved || false,

    remainingTimeFormatted,
    overdueDurationFormatted,
    recommendedAction,
    availableActions: ['View Case', 'Reassign', 'Escalate']
  };
};
