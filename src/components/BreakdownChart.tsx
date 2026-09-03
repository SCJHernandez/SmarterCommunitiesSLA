import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BreakdownDataPoint } from '../models';

interface BreakdownChartProps {
  title: string;
  data: BreakdownDataPoint[];
  color?: string;
  onClick?: (name: string) => void;
}

export function BreakdownChart({ title, data, color = '#6366f1', onClick }: BreakdownChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 500 }} 
              width={100}
            />
            <Tooltip 
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [`${value} breaches`, '']}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]} 
              barSize={24}
              onClick={(data) => onClick && onClick(data.name)}
              cursor={onClick ? "pointer" : "default"}
            >
              {data.map((entry, index) => {
                // Find the max value to highlight it
                const maxValue = Math.max(...data.map(d => d.value));
                const isWorst = entry.value === maxValue;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isWorst ? color : '#e5e7eb'} 
                    fillOpacity={isWorst ? 0.9 : 1} 
                    className={onClick ? "hover:opacity-80 transition-opacity" : ""}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
