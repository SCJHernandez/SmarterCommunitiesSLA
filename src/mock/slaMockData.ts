import { DataverseSlaKpiInstance } from '../models';
import { addDays, format, subDays } from 'date-fns';

const generateMockDataverseInstances = (count: number): DataverseSlaKpiInstance[] => {
  const today = new Date();
  
  const priorities = [1, 2, 3]; // 1=High, 2=Normal, 3=Low
  const teams = ['Support Tier 1', 'Support Tier 2', 'Billing', 'Technical Account Managers'];
  const owners = ['Jane Doe', 'John Smith', 'Alice Johnson', 'Bob Williams', 'Unassigned'];
  const categories = ['Hardware', 'Software', 'Access', 'Billing', 'Inquiry'];
  const kpis = [
    { id: 'kpi-1', name: 'Resolve KPI' },
    { id: 'kpi-2', name: 'First Response KPI' }
  ];
  
  const statuses = [
    { code: 3, weight: 65 }, // Succeeded
    { code: 0, weight: 15 }, // In Progress
    { code: 2, weight: 12 }, // Nearing Noncompliance
    { code: 1, weight: 8 },  // Noncompliant
  ];

  return Array.from({ length: count }).map((_, i) => {
    // Determine status based on weight
    const rand = Math.random() * 100;
    let sum = 0;
    let statusCode = 3;
    for (const s of statuses) {
      sum += s.weight;
      if (rand <= sum) {
        statusCode = s.code;
        break;
      }
    }

    const priorityCode = priorities[Math.floor(Math.random() * priorities.length)];
    const team = teams[Math.floor(Math.random() * teams.length)];
    const owner = owners[Math.floor(Math.random() * owners.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // 90% Resolve KPI, 10% First Response KPI
    const kpi = Math.random() > 0.1 ? kpis[0] : kpis[1];

    const createdDaysAgo = Math.floor(Math.random() * 30);
    const createdOn = format(subDays(today, createdDaysAgo), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    
    let failuretime = format(addDays(today, 2), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    let warningtime = format(addDays(today, 1), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    let succeededon: string | null = null;
    
    if (statusCode === 1) {
      failuretime = format(addDays(today, -1), "yyyy-MM-dd'T'HH:mm:ss'Z'");
      warningtime = format(addDays(today, -2), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    } else if (statusCode === 2) {
      const minutesRemaining = Math.floor(Math.random() * 110) + 10;
      failuretime = format(new Date(Date.now() + minutesRemaining * 60000), "yyyy-MM-dd'T'HH:mm:ss'Z'");
      warningtime = format(subDays(new Date(failuretime), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    } else if (statusCode === 3) {
      failuretime = format(addDays(today, -createdDaysAgo + 2), "yyyy-MM-dd'T'HH:mm:ss'Z'");
      warningtime = format(addDays(today, -createdDaysAgo + 1), "yyyy-MM-dd'T'HH:mm:ss'Z'");
      succeededon = format(addDays(today, -createdDaysAgo + 1.5), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    }

    return {
      slakpiinstanceid: `sla-${i}-${Date.now()}`,
      name: `SLA-${1000 + i}`,
      _regardingobjectid_value: `case-${i}`,
      regardingobjectid_type: 'incident',
      regardingobjectid_number: `CAS-${10000 + i}-X9Y8Z`,
      regardingobjectid_title: `Issue with ${category} ${i}`,
      _slakpiid_value: kpi.id,
      slakpiid_name: kpi.name,
      statuscode: statusCode,
      failuretime,
      warningtime,
      succeededon,
      createdon: createdOn,
      modifiedon: createdOn,
      _ownerid_value: owner,
      ownerid_name: owner,
      _owningteam_value: team,
      owningteam_name: team,
      prioritycode: priorityCode,
      category,
    };
  });
};

export const mockDataverseInstances = generateMockDataverseInstances(500);
