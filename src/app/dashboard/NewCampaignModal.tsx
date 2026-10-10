'use client';

import { useState } from 'react';
import { X, ArrowRight, Loader2, FileText } from 'lucide-react';
import { createCampaign } from '../actions';

export default function NewCampaignModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      // 1. Create the campaign row in the database
      const campaign = await createCampaign(formData);
      
      // 2. Safeguard check: ensure we actually got an ID back
      if (!campaign || !campaign.id) {
        console.error("Server Action failed to return a valid Campaign ID:", campaign);
        setIsSubmitting(false);
        return; 
      }

      // 3. Close the modal
      setIsOpen(false);
      
      // 4. THE FIX: Hard browser redirect instead of Next.js soft-routing.
      // This bypasses the Next.js cache and guarantees the new URL loads fresh.
      window.location.href = `/dashboard/setup/${campaign.id}`;
      
    } catch (error) {
      console.error("Failed to create campaign", error);
      setIsSubmitting(false);
    }
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
                Create New Campaign
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Naming the Campaign */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Campaign Name</label>
                  <input 
                    type="text" 
                    name="campaignName"
                    required
                    placeholder="e.g., Main Lobby Intake" 
                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Name this specific routing link (e.g. "Housing Authority Lobby" or "Building C Notices").
                  </p>
                </div>
                
                {/* Visual Context for the Persian Saga */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3">
                  <div className="text-purple-600 mt-0.5">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-900">Next Step: Document Upload</h4>
                    <p className="text-xs text-purple-700 mt-1">
                      You will need to upload 5 sample documents on the next screen to train the translation model before your QR code can be generated.
                    </p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} /> Starting Setup...
                    </>
                  ) : (
                    <>
                      Next: Upload 5 Samples <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}