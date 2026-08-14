'use client';

import { useState } from 'react';
import { X, QrCode, Download, ArrowRight, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { createCampaign } from '../actions';

export default function NewCampaignModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const campaign = await createCampaign(formData);
      setActiveCampaign(campaign);
    } catch (error) {
      console.error("Failed to create campaign", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("CampaignQRCode");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Ahani_QR_${activeCampaign.name}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-slate-900 text-white font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm"
      >
        + New Campaign
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {activeCampaign ? 'Campaign Generated' : 'Create New Campaign'}
              </h2>
              <button onClick={() => { setIsOpen(false); setActiveCampaign(null); }} className="text-slate-400 hover:text-slate-600 transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {!activeCampaign ? (
                /* Step 1: Naming the Campaign */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Campaign Name</label>
                    <input 
                      type="text" 
                      name="campaignName"
                      required
                      placeholder="e.g., Main Lobby Intake" 
                      className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">This generates a unique routing QR code linked to your agency's scan quota.</p>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />}
                    {isSubmitting ? 'Generating...' : 'Generate Routing QR'}
                  </button>
                </form>
              ) : (
                /* Step 2: The Generated QR Code */
                <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-4 inline-block">
                    <QRCode 
                      id="CampaignQRCode"
                      value={activeCampaign.qr_code_url} 
                      size={200}
                      level="H"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{activeCampaign.name}</h3>
                  <p className="text-xs text-slate-500 mb-6 font-mono bg-slate-100 px-2 py-1 rounded mt-1">
                    {activeCampaign.qr_code_url}
                  </p>
                  
                  <div className="w-full space-y-3">
                    <button 
                      onClick={downloadQR}
                      className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                      <Download size={18} /> Download High-Res PNG
                    </button>
                    <button 
                      onClick={() => { setIsOpen(false); setActiveCampaign(null); }}
                      className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2"
                    >
                      Done <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}