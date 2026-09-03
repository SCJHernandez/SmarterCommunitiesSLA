import { BreakdownDataPoint } from '../models';

export interface SlaBreakdown {
  priorityBreakdown: BreakdownDataPoint[];
  teamBreakdown: BreakdownDataPoint[];
}
