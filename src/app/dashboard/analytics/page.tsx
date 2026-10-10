import { Download, AlertCircle, MessageSquare, ShieldBan, PieChart, TrendingUp, FileText, CheckCircle2, Grid } from 'lucide-react';
import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import ExportButton from './ExportButton';
import DashboardCharts from './DashboardCharts';

// The 5 fixed buckets matched exactly to our Supabase database constraints
const CONFUSION_BUCKETS = [
  { id: 'action_required', label: 'Action & Instructions' },
  { id: 'deadline_urgency', label: 'Deadlines & Dates' },
  { id: 'benefit_impact', label: 'Status & Eligibility' },
  { id: 'payment_fee', label: 'Financial & Fees' },
  { id: 'contact_location', label: 'Submission & Office' }
];

// Helper function to color-code the matrix cells based on volume
function getHeatClass(count: number) {
  if (count === 0) return 'bg-slate-50 text-slate-300 border-slate-100';
  if (count <= 15) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (count <= 50) return 'bg-orange-100 text-orange-900 border-orange-300 font-medium';
  return 'bg-red-100 text-red-900 border-red-400 font-bold shadow-sm';
}

export default async function AnalyticsDashboard() {
  const supabase = await createClient();

  // 1. Verify Auth & Fetch Agency ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.agency_id) redirect('/login');

  // 2. Fetch the REAL Scan Logs for this Agency
  const { data: rawLogs } = await supabase
    .from('scan_logs')
    .select(`
      id, created_at, language_code, document_classification, processing_time_ms, outcome_status, pii_retained,
      campaigns!inner ( name, agency_id )
    `)
    .eq('campaigns.agency_id', profile.agency_id)
    .order('created_at', { ascending: false });

  const safeLogs = rawLogs || [];

  // 3. Fetch the Confusion Matrix from our Postgres RPC Function
  const { data: rawMatrix } = await supabase.rpc('get_confusion_matrix', { 
    p_agency_id: profile.agency_id 
  });

  // Transform the flat RPC data into a 2D grouping by Campaign Name
  const campaignsMap: Record<string, Record<string, number>> = {};
  
  if (rawMatrix) {
    rawMatrix.forEach((row: any) => {
      if (!campaignsMap[row.campaign_name]) {
        campaignsMap[row.campaign_name] = {
           action_required: 0,
           deadline_urgency: 0,
           benefit_impact: 0,
           payment_fee: 0,
           contact_location: 0,
        };
      }
      campaignsMap[row.campaign_name][row.bucket] = Number(row.event_count);
    });
  }

  const matrixRows = Object.entries(campaignsMap).map(([name, buckets]) => ({ name, ...buckets }));

  // 4. Calculate Top-Level Metrics
  const totalScans = safeLogs.length;
  const rejectedScans = safeLogs.filter(log => !log.outcome_status?.includes('Success')).length;
  const approvedScans = totalScans - rejectedScans;

  const languageCounts = safeLogs.reduce((acc, log) => {
    const lang = log.language_code || 'Unknown';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedLanguages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]);
  const primaryLanguage = sortedLanguages.length > 0 ? sortedLanguages[0][0] : 'None';
  const primaryPercent = totalScans > 0 && sortedLanguages.length > 0 
    ? Math.round((sortedLanguages[0][1] / totalScans) * 100) 
    : 0;

  const topLanguages = sortedLanguages.slice(0, 5).map(([name, count]) => ({
    name,
    percent: totalScans > 0 ? Math.round((count / totalScans) * 100) : 0,
    count 
  }));

  const documentCounts = safeLogs.reduce((acc, log) => {
    const doc = log.document_classification || 'Uncategorized';
    acc[doc] = (acc[doc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topDocuments = Object.entries(documentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const chartLanguageData = topLanguages.map(lang => ({ name: lang.name, value: lang.count }));
  const chartDocumentData = topDocuments.map(([name, count]) => ({ name, value: count }));

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Title VI Compliance Report</h1>
          <p className="text-slate-500 mt-1">Official language access metrics and interaction logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200">
            <CheckCircle2 size={14} /> Zero PII Retained
          </div>
          <ExportButton logs={safeLogs} />
        </div>
      </div>

      {/* Top Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 font-medium text-sm">Total Sessions Delivered</h3>
            <PieChart size={18} className="text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{approvedScans.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 font-medium text-sm">Primary LEP Language</h3>
            <TrendingUp size={18} className="text-green-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 uppercase">
            {primaryLanguage} <span className="text-lg font-medium text-slate-400 normal-case">{primaryPercent}%</span>
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-600 font-medium text-sm">Blocked by AI Security</h3>
            <ShieldBan size={18} className="text-red-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{rejectedScans.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Invalid captures rejected automatically.</p>
        </div>
      </div>

      {/* Title VI Charts Component */}
      <DashboardCharts languageData={chartLanguageData} documentData={chartDocumentData} />

      {/* The New Confusion Heat Grid */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Document Friction Heatmap</h2>
            <p className="text-sm text-slate-500 mt-1">Identify structural issues in your English master documents based on AI-categorized follow-up questions.</p>
          </div>
          <Grid className="text-slate-400" size={24} />
        </div>

        {matrixRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <MessageSquare className="text-slate-300 mb-3" size={32} />
            <p className="text-slate-600 font-bold">No data collected yet</p>
            <p className="text-sm text-slate-500 mt-1 text-center max-w-md">Once citizens begin scanning your documents and asking follow-up questions, the AI will aggregate the friction points here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tl-xl w-1/4">
                    Document / Campaign
                  </th>
                  {CONFUSION_BUCKETS.map((bucket) => (
                    <th key={bucket.id} className="p-4 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                      {bucket.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900 border-r border-slate-100">
                      {row.name}
                    </td>
                    {CONFUSION_BUCKETS.map((bucket) => {
                     const count = (row as Record<string, any>)[bucket.id] || 0;
                      return (
                        <td key={bucket.id} className="p-2 text-center">
                          <div className={`mx-auto w-12 h-8 flex items-center justify-center rounded-md border text-sm transition-all ${getHeatClass(count)}`}>
                            {count > 0 ? count : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2">
          <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-slate-500 leading-relaxed">
            *Red indicator cells highlight dense concentrations of citizen confusion. Use these insights to rewrite specific sections of your English master documents prior to the next physical mailing run.
          </p>
        </div>
      </div>

    </div>
  );
}