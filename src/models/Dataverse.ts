export interface DataverseSlaKpiInstance {
  slakpiinstanceid: string;
  name: string;
  _regardingobjectid_value: string;
  regardingobjectid_type: string;
  regardingobjectid_number: string;
  regardingobjectid_title: string;
  _slakpiid_value: string;
  slakpiid_name: string;
  statuscode: number; // 0=In Progress, 1=Noncompliant, 2=Nearing Noncompliance, 3=Succeeded, 4=Paused, 5=Canceled
  failuretime: string;
  warningtime: string;
  succeededon: string | null;
  createdon: string;
  modifiedon: string;
  _ownerid_value: string;
  ownerid_name: string;
  _owningteam_value: string;
  owningteam_name: string;
  prioritycode: number; // 1=High, 2=Normal, 3=Low
  category: string;
}
