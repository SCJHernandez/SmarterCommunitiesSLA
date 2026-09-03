import React, { useState, useMemo } from 'react';
import { SlaKpiInstance } from '../models';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { RecordDetailDrawer } from './RecordDetailDrawer';
import { format, parseISO } from 'date-fns';

interface SlaRecordsViewProps {
  records: SlaKpiInstance[];
}

type SortField = 'regardingNumber' | 'priority' | 'owner' | 'team' | 'status' | 'failureTime';
type SortDir = 'asc' | 'desc';

export function SlaRecordsView({ records }: SlaRecordsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('failureTime');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<SlaKpiInstance | null>(null);
  
  const pageSize = 15;

  // Filter & Search
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.regardingNumber?.toLowerCase() || '').includes(q) ||
        (r.regardingSubject?.toLowerCase() || '').includes(q) ||
        (r.owner?.toLowerCase() || '').includes(q) ||
        (r.team?.toLowerCase() || '').includes(q)
      );
    });
  }, [records, searchQuery]);

  // Sort
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      
      if (sortField === 'priority') {
        const pOrder: any = { 'High': 1, 'Normal': 2, 'Low': 3 };
        valA = pOrder[a.priority];
        valB = pOrder[b.priority];
      } else if (sortField === 'status') {
        const sOrder: any = { 'Noncompliant': 1, 'Nearing Noncompliance': 2, 'In Progress': 3, 'Succeeded': 4 };
        valA = sOrder[a.status] || 99;
        valB = sOrder[b.status] || 99;
      }
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortDir]);

  // Paginate
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[600px]">
      
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by case number, regardingSubject, owner..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('regardingNumber')}>
                <div className="flex items-center gap-1">Case Record <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">SLA Status <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('priority')}>
                <div className="flex items-center gap-1">Priority <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('kpiName')}>
                <div className="flex items-center gap-1">SLA Item <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('owner')}>
                <div className="flex items-center gap-1">Owner / Team <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('failureTime')}>
                <div className="flex items-center gap-1">Deadline <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No records found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr 
                  key={record.id} 
                  onClick={() => setSelectedRecord(record)}
                  className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">{record.regardingNumber}</span>
                      <span className="text-gray-900 font-medium truncate max-w-[250px] lg:max-w-[300px]" title={record.regardingSubject}>
                        {record.regardingSubject}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      record.status === 'Noncompliant' ? 'bg-red-100 text-red-800' :
                      record.status === 'Nearing Noncompliance' ? 'bg-amber-100 text-amber-800' :
                      record.status === 'Succeeded' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {record.status}
                    </span>
                    {record.status === 'Noncompliant' && record.overdueDurationFormatted && (
                      <div className="text-[11px] font-bold text-red-600 mt-1 uppercase tracking-wider">
                        {record.overdueDurationFormatted} overdue
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      record.priority === 'High' ? 'bg-gray-800 text-white' :
                      record.priority === 'Normal' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {record.priority}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">
                      {record.kpiName}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-medium ${record.owner === 'Unassigned' ? 'text-red-500' : 'text-gray-900'}`}>
                        {record.owner}
                      </span>
                      <span className="text-xs text-gray-500">{record.team}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-gray-600">
                    {record.failureTime ? format(parseISO(record.failureTime), 'MMM d, yyyy h:mm a') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col divide-y divide-gray-100">
        {paginatedRecords.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            No records found matching criteria.
          </div>
        ) : (
          paginatedRecords.map((record) => (
            <div 
              key={record.id} 
              onClick={() => setSelectedRecord(record)}
              className="p-4 flex flex-col gap-3 hover:bg-gray-50/50 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-indigo-600">{record.regardingNumber}</span>
                  <span className="text-gray-900 font-medium line-clamp-2" title={record.regardingSubject}>
                    {record.regardingSubject}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  record.priority === 'High' ? 'bg-gray-800 text-white' :
                  record.priority === 'Normal' ? 'bg-gray-100 text-gray-800' :
                  'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  {record.priority}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    record.status === 'Noncompliant' ? 'bg-red-100 text-red-800' :
                    record.status === 'Nearing Noncompliance' ? 'bg-amber-100 text-amber-800' :
                    record.status === 'Succeeded' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {record.status}
                  </span>
                  {record.status === 'Noncompliant' && record.overdueDurationFormatted && (
                    <span className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-wider">
                      {record.overdueDurationFormatted} overdue
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg p-2 mt-1">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Owner</span>
                  <span className={`font-medium ${record.owner === 'Unassigned' ? 'text-red-500' : 'text-gray-900'}`}>{record.owner}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Deadline</span>
                  <span className="text-gray-900 font-medium">
                    {record.failureTime ? format(parseISO(record.failureTime), 'MMM d, h:mm a') : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, filteredRecords.length)}</span> of <span className="font-medium text-gray-900">{filteredRecords.length}</span> records
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            Previous
          </button>
          <div className="px-3 text-sm font-medium text-gray-700">
            {currentPage} / {totalPages}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Detail Drawer */}
      <RecordDetailDrawer 
        record={selectedRecord} 
        onClose={() => setSelectedRecord(null)} 
      />

    </div>
  );
}
