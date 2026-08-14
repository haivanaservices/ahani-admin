import { Download, AlertCircle, MessageSquare, ShieldBan, PieChart, TrendingUp } from 'lucide-react';
import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import ExportButton from './ExportButton'; // <-- Fixed the stray parenthesis here!

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

  // 3. Calculate Real Metrics from Database
  const totalScans = safeLogs.length;
  const rejectedScans = safeLogs.filter(log => !log.outcome_status?.includes('Success')).length;
  const approvedScans = totalScans - rejectedScans;

  // Calculate Primary Language dynamically
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

  // Hardcoded Confusion Alerts (Until we build the Follow-Up Question tracking table!)
  const confusionAlerts = [
    { form: 'Notice of Action', question: '"Does this mean I lost my benefits?"', count: 142 },
    { form: 'Medical Renewal', question: '"Where do I mail this back?"', count: 89 },
  ];

  // Hardcoded Demo Language Demographics (Since your database might be empty right now)
  // When ready, we will map 'sortedLanguages' into this array.
  const topLanguages = [
    { name: 'Spanish', percent: 45 },
    { name: 'Tagalog', percent: 22 },
    { name: 'Vietnamese', percent: 15 },
    { name: 'Mandarin', percent: 10 },
    { name: 'Other', percent: 8 },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      
      {/* Page Header & Title VI Export */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Compliance & Analytics</h1>
          <p className="text-slate-500 mt-1">Language access metrics and document performance.</p>
        </div>
        {/* Replace static button with our dynamic Client Component */}
        <ExportButton logs={safeLogs} />
      </div>

      {/* Top Stat Row - NOW WIRED TO REAL DB */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 font-medium text-sm">Approved Scans</h3>
            <PieChart size={18} className="text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{approvedScans.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 font-medium text-sm">Primary Language</h3>
            <TrendingUp size={18} className="text-green-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 uppercase">
            {primaryLanguage} <span className="text-lg font-medium text-slate-400 normal-case">{primaryPercent}%</span>
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-600 font-medium text-sm">Blocked by AI Bouncer</h3>
            <ShieldBan size={18} className="text-red-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{rejectedScans.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Invalid documents rejected automatically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Language Demographics (Left as Demo UI for now) */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Language Demographics</h2>
          <div className="space-y-5">
            {topLanguages.map((lang, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-slate-700">{lang.name}</span>
                  <span className="font-medium text-slate-500">{lang.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${lang.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: The Confusion Heatmap (Left as Demo UI for now) */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Confusion Heatmap</h2>
              <p className="text-sm text-slate-500 mt-1">Trending follow-up questions from citizens.</p>
            </div>
            <MessageSquare className="text-slate-400" size={24} />
          </div>

          <div className="space-y-4 flex-1">
            {confusionAlerts.map((alert, index) => (
              <div key={index} className="p-4 rounded-xl border border-orange-200 bg-orange-50 flex items-start gap-4">
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    {alert.form} <span className="bg-white px-2 py-0.5 rounded text-xs text-slate-500 border border-orange-100 ml-2">{alert.count} instances</span>
                  </p>
                  <p className="text-sm text-slate-700 italic">
                    {alert.question}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              *Use these insights to clarify language on your next physical mailer run.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}