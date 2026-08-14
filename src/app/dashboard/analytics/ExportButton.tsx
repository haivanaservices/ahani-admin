'use client';

import { Download } from 'lucide-react';

export default function ExportButton({ logs }: { logs: any[] }) {
  const handleDownload = () => {
    const headers = ['Timestamp (UTC)', 'Access Point', 'Requested Language', 'Document Classification', 'Processing Time', 'Outcome', 'PII Retained'];
    const csvRows = logs.map(log => {
      const accessPoint = log.campaigns?.name || 'Unknown Touchpoint';
      const processingTime = log.processing_time_ms ? `${(log.processing_time_ms / 1000).toFixed(1)}s` : 'N/A';
      return [
        log.created_at, `"${accessPoint}"`, log.language_code || 'Unknown', `"${log.document_classification || 'Unrecognized'}"`, processingTime, `"${log.outcome_status || 'Pending'}"`, 'FALSE'
      ].join(',');
    });
    
    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Title_VI_Compliance_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={logs.length === 0}
      className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
    >
      <Download size={18} />
      Export Title VI Report (CSV)
    </button>
  );
}