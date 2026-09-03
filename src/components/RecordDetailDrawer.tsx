import React from 'react';
import { SlaKpiInstance } from '../models';
import { X, CheckCircle2, Clock, AlertTriangle, User, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

interface RecordDetailDrawerProps {
  record: SlaKpiInstance | null;
  onClose: () => void;
}

export function RecordDetailDrawer({ record, onClose }: RecordDetailDrawerProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Case Reference
            </div>
            <h2 className="text-xl font-bold text-gray-900">{record.regardingNumber}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          
          <div className="p-6 space-y-8">
            {/* Status Banner */}
            <div className={`px-4 py-3 rounded-lg border flex items-center gap-3 ${
              record.status === 'Noncompliant' ? 'bg-red-50 border-red-100 text-red-800' :
              record.status === 'Nearing Noncompliance' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              record.status === 'Succeeded' ? 'bg-green-50 border-green-100 text-green-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}>
              {record.status === 'Noncompliant' ? <ShieldAlert className="w-5 h-5" /> :
               record.status === 'Nearing Noncompliance' ? <AlertTriangle className="w-5 h-5" /> :
               record.status === 'Succeeded' ? <CheckCircle2 className="w-5 h-5" /> :
               <Clock className="w-5 h-5" />}
              <div>
                <div className="font-semibold">{record.status}</div>
                {record.status === 'Noncompliant' && (
                  <div className="text-sm opacity-90 mt-0.5">Breached SLA deadline</div>
                )}
              </div>
            </div>

            {/* Case Information */}
            <section>
              <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Case Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Subject</div>
                  <div className="font-medium text-gray-900">{record.regardingSubject}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Priority</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      record.priority === 'High' ? 'bg-red-100 text-red-800' :
                      record.priority === 'Normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.priority}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Owner</div>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <User className="w-4 h-4 text-gray-400" />
                      {record.owner}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Team</div>
                    <div className="text-sm font-medium">{record.team}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* SLA Information */}
            <section>
              <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">SLA Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">KPI</span>
                  <span className="font-medium text-gray-900">{record.kpiName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-gray-900">{record.status}</span>
                </div>
                {record.status === 'Noncompliant' && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Overdue Duration</span>
                    <span className="font-bold text-red-600">{record.overdueDurationFormatted}</span>
                  </div>
                )}
                {record.status === 'Nearing Noncompliance' && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Remaining Time</span>
                    <span className="font-bold text-amber-600">{record.remainingTimeFormatted}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Timeline</h3>
              <div className="relative pl-6 space-y-6">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />

                {/* Start */}
                <div className="relative">
                  <div className="absolute -left-[28.5px] top-1 w-3.5 h-3.5 bg-gray-200 border-2 border-white rounded-full" />
                  <div className="text-sm font-medium text-gray-900">SLA Started</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {record.createdOn ? format(parseISO(record.createdOn), 'MMM d, yyyy h:mm a') : 'Unknown'}
                  </div>
                </div>

                {/* Warning */}
                {record.warningTime && (
                  <div className="relative">
                    <div className="absolute -left-[28.5px] top-1 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full" />
                    <div className="text-sm font-medium text-gray-900">Warning Threshold</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(parseISO(record.warningTime), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                )}

                {/* Target / Completed */}
                {record.succeededOn ? (
                  <div className="relative">
                    <div className="absolute -left-[28.5px] top-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    <div className="text-sm font-medium text-green-700">Completed</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(parseISO(record.succeededOn), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className={`absolute -left-[28.5px] top-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                      record.status === 'Noncompliant' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <div className={`text-sm font-medium ${
                      record.status === 'Noncompliant' ? 'text-red-700' : 'text-gray-900'
                    }`}>Deadline</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {record.failureTime ? format(parseISO(record.failureTime), 'MMM d, yyyy h:mm a') : 'Unknown'}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
        
        {/* Actions Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            Reassign
          </button>
          <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            Escalate
          </button>
          <button 
            className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => {
              if (record.regardingId) {
                window.open(`https://smartercommunities.crm6.dynamics.com/main.aspx?appid=4bdd0e5b-3187-4907-b71f-bb4e5e3bf8f0&pagetype=entityrecord&etn=incident&id=${record.regardingId}`, '_blank');
              }
            }}
          >
            View Case
          </button>
        </div>

      </div>
    </div>
  );
}
