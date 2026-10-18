'use client';

import { useState } from 'react';
import { Settings, Download, FileEdit, Trash2, X } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { deleteCampaign, resetCampaignFingerprint } from '../../actions';

export default function CampaignActionMenu({ campaignId, campaignName, qrUrl }: { campaignId: string; campaignName: string; qrUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const downloadPNG = () => {
    const canvas = document.getElementById(`qr-canvas-${campaignId}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${campaignName.replace(/\s+/g, '_')}_Routing_QR.png`;
      link.click();
    }
  };

  const downloadSVG = () => {
    const svg = document.getElementById(`qr-svg-${campaignId}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${campaignName.replace(/\s+/g, '_')}_Routing_QR.svg`;
      link.click();
    }
  };

  return (
    <>
      {/* 1. Explicit Action Button (Replaces the 3 dots) */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition rounded-lg flex items-center gap-2 border border-slate-200"
      >
        <Settings size={16} /> Manage
      </button>

      {/* Hidden staging area for standard-res QR code generation */}
      <div className="hidden">
        {/* CHANGED FROM 1024 TO 256 BELOW */}
        <QRCodeCanvas id={`qr-canvas-${campaignId}`} value={qrUrl} size={256} level="M" />
        <QRCodeSVG id={`qr-svg-${campaignId}`} value={qrUrl} size={256} level="M" />
      </div>

      {/* 2. Pop-out Modal Overlay (Escapes the table boundary) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Manage Campaign</h3>
                <p className="text-sm text-slate-500 font-mono mt-1">{campaignName}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-slate-700 transition p-1 rounded-md hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Actions */}
            <div className="p-5 space-y-3">
              <button onClick={() => { downloadPNG(); setIsOpen(false); }} className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition gap-4 shadow-sm">
                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg"><Download size={20} /></div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-base">Download QR (PNG)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Standard image for basic printing</div>
                </div>
              </button>

              <button onClick={() => { downloadSVG(); setIsOpen(false); }} className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition gap-4 shadow-sm">
                <div className="bg-purple-100 text-purple-600 p-2.5 rounded-lg"><Download size={20} /></div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-base">Download QR (SVG)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Vector image for large signage / scaling</div>
                </div>
              </button>

              <div className="border-t border-slate-100 my-2 pt-2"></div>

              <form action={resetCampaignFingerprint} onSubmit={() => setIsOpen(false)}>
                <input type="hidden" name="campaignId" value={campaignId} />
                <button type="submit" className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition gap-4 shadow-sm group">
                  <div className="bg-orange-100 text-orange-600 p-2.5 rounded-lg group-hover:bg-orange-200 transition"><FileEdit size={20} /></div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 group-hover:text-orange-800 transition text-base">Reassign Baseline</div>
                    <div className="text-xs text-slate-500 group-hover:text-orange-600 transition mt-0.5">Retrain AI fingerprint without changing QR</div>
                  </div>
                </button>
              </form>

              <form action={deleteCampaign} onSubmit={(e) => { if(!confirm('Are you sure you want to revoke this link and delete the campaign?')) e.preventDefault(); else setIsOpen(false); }}>
                <input type="hidden" name="campaignId" value={campaignId} />
                <button type="submit" className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition gap-4 shadow-sm group">
                  <div className="bg-red-100 text-red-600 p-2.5 rounded-lg group-hover:bg-red-200 transition"><Trash2 size={20} /></div>
                  <div className="text-left">
                    <div className="font-bold text-red-700 group-hover:text-red-800 transition text-base">Delete Campaign</div>
                    <div className="text-xs text-red-500 mt-0.5">Revoke link and permanently delete data</div>
                  </div>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
}