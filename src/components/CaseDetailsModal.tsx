import React from "react";
import { X, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { SlaActionRecord } from "../models";

interface CaseDetailsModalProps {
  record: SlaActionRecord;
  onClose: () => void;
}

export function CaseDetailsModal({ record, onClose }: CaseDetailsModalProps) {
  const isBreached = record.category === "BREACHED";
  const isAtRisk = record.category === "AT_RISK";

  const formatTimelineDate = (dateString?: string) => {
    if (!dateString) return "--";
    try {
      return format(parseISO(dateString), "MMM d, yyyy h:mm a");
    } catch {
      return "--";
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-[500px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CASE REFERENCE</p>
            <h2 className="text-xl font-bold text-gray-900">{record.regardingNumber}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
          
          {/* Status Alert */}
          <div className={`rounded-lg p-4 mb-8 border flex items-start gap-3 ${
            isBreached ? "bg-red-50 border-red-100 text-red-900" : 
            isAtRisk ? "bg-amber-50 border-amber-100 text-amber-900" : 
            "bg-blue-50 border-blue-100 text-blue-900"
          }`}>
            <div className="mt-0.5">
              {isBreached ? <ShieldAlert size={20} className="text-red-500" /> : 
               isAtRisk ? <Clock size={20} className="text-amber-500" /> : 
               <CheckCircle size={20} className="text-blue-500" />}
            </div>
            <div>
              <p className="font-semibold text-sm">{record.status}</p>
              <p className="text-xs mt-0.5 opacity-90">
                {isBreached ? "Breached SLA deadline" : 
                 isAtRisk ? "Approaching SLA deadline" : 
                 "SLA is on track"}
              </p>
            </div>
          </div>

          {/* Case Information */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">CASE INFORMATION</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1 text-xs">Subject</p>
                <p className="font-medium text-gray-900 leading-snug">{record.regardingSubject}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 mb-1 text-xs">Priority</p>
                  <p className="font-semibold text-gray-900">{String(record.priority).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 text-xs">Owner</p>
                  <div className="flex items-center gap-1.5 font-medium text-gray-900">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600">
                      {record.owner ? record.owner.charAt(0) : "?"}
                    </div>
                    {record.owner}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-1 text-xs">Team</p>
                <p className="font-medium text-gray-900">{record.team || "--"}</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* SLA Information */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">SLA INFORMATION</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <p className="text-gray-500">KPI</p>
                <p className="font-medium text-gray-900">{record.kpiName}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{record.status}</p>
              </div>
              {isBreached && (
                <div className="flex justify-between items-center">
                  <p className="text-gray-500">Overdue Duration</p>
                  <p className="font-bold text-red-600">{record.overdueDurationFormatted}</p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">TIMELINE</h3>
            
            <div className="relative border-l border-gray-200 ml-2 space-y-6">
              
              {/* Started */}
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-gray-300 rounded-full -left-[4.5px] top-1.5 ring-4 ring-white"></div>
                <p className="font-semibold text-sm text-gray-900 mb-0.5">SLA Started</p>
                <p className="text-xs text-gray-500">{formatTimelineDate(record.createdOn)}</p>
              </div>

              {/* Warning */}
              {record.warningTime && (
                <div className="relative pl-6">
                  <div className="absolute w-2 h-2 bg-amber-400 rounded-full -left-[4.5px] top-1.5 ring-4 ring-white"></div>
                  <p className="font-semibold text-sm text-gray-900 mb-0.5">Warning Threshold</p>
                  <p className="text-xs text-gray-500">{formatTimelineDate(record.warningTime)}</p>
                </div>
              )}

              {/* Deadline */}
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-red-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-white"></div>
                <p className="font-semibold text-sm text-gray-900 mb-0.5">Deadline</p>
                <p className="text-xs text-gray-500">{formatTimelineDate(record.deadline)}</p>
              </div>

            </div>
          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end mt-auto">
          <button 
            className="px-4 py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reassign
          </button>
          <button 
            className="px-4 py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Escalate
          </button>
          <button 
            className="px-4 py-2 bg-[#6b21a8] text-white rounded-md text-sm font-medium hover:bg-[#581c87] transition-colors shadow-sm"
            onClick={() => {
              window.open(`https://smartercommunities.crm6.dynamics.com/main.aspx?appid=4bdd0e5b-3187-4907-b71f-bb4e5e3bf8f0&pagetype=entityrecord&etn=incident&id=${record.regardingId}`, "_blank");
            }}
          >
            View Case
          </button>
        </div>

      </div>
    </div>
  );
}
