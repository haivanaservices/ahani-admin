'use client';

import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { FileText, Globe } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardCharts({ languageData, documentData }: { languageData: any[], documentData: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Chart 1: Language Demographics (Pie) */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Language Demographics</h2>
            <p className="text-sm text-slate-500 mt-1">Breakdown of LEP languages served.</p>
          </div>
          <Globe className="text-slate-400" size={24} />
        </div>
        
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={languageData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {languageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${value} Scans`, 'Traffic']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Custom Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {languageData.map((lang, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
              <span className="font-medium text-slate-700">{lang.name}</span>
              <span className="text-slate-400">({lang.value})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Vital Documents (Bar) */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Highest Traffic Documents</h2>
            <p className="text-sm text-slate-500 mt-1">Identifies your "Vital Documents" for Title VI.</p>
          </div>
          <FileText className="text-slate-400" size={24} />
        </div>
        
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={documentData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}