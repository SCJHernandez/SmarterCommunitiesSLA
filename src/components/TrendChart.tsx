import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimeSeriesDataPoint } from '../models';

interface TrendChartProps {
  data: TimeSeriesDataPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 w-full h-[300px] md:h-[400px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">SLA Resolution Trend</h3>
        <p className="text-sm text-gray-500">Daily volume of SLA instances by outcome</p>
      </div>
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSucceeded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '14px', fontWeight: 500 }}
              labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            <Area type="monotone" dataKey="Succeeded" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSucceeded)" />
            <Area type="monotone" dataKey="Open" name="At Risk / Open" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorOpen)" />
            <Area type="monotone" dataKey="Failed" name="Breached" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
