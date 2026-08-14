'use client';

import { useState, useRef } from 'react';
import { 
  Fingerprint, UploadCloud, ShieldCheck, QrCode, 
  RefreshCw, Ban, Link2, FileText, CheckCircle2, X
} from 'lucide-react';
import { establishBaselineFingerprint, revokeProfileFingerprint } from './actions';

interface ProfileClientProps {
  agencyId: string;
  agencyName: string;
  hasFingerprint: boolean;
}

export default function ProfileClient({ agencyId, agencyName, hasFingerprint }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'fingerprint' | 'qr'>('fingerprint');
  const [isUploading, setIsUploading] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray].slice(0, 5)); // Cap at 5 files
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleRevoke() {
    if (!confirm("Are you sure you want to revoke your current verification profile? The mobile app will not be able to verify documents until you create a new one.")) return;
    
    setIsRevoking(true);
    try {
      await revokeProfileFingerprint();
    } catch (error) {
      console.error(error);
      setIsRevoking(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Security & Fingerprinting</h1>
          <p className="text-slate-500 mt-1">Manage {agencyName}'s document verification and QR lifecycles.</p>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${hasFingerprint ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          <ShieldCheck size={20} />
          <span className="font-bold text-sm">
            {hasFingerprint ? 'Active Enforcer' : 'Setup Required'}
          </span>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('fingerprint')}
          className={`pb-3 font-bold text-sm border-b-2 transition ${activeTab === 'fingerprint' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Document Fingerprint
        </button>
        <button 
          onClick={() => setActiveTab('qr')}
          className={`pb-3 font-bold text-sm border-b-2 transition ${activeTab === 'qr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          QR Lifecycle Management
        </button>
      </div>

      {/* TAB 1: DOCUMENT FINGERPRINT */}
      {activeTab === 'fingerprint' && (
        <div className="space-y-6">
          <div className={`p-8 rounded-2xl border shadow-sm ${hasFingerprint ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 border-dashed'}`}>
            <div className="flex flex-col items-center justify-center text-center">
              {hasFingerprint ? (
                <>
                  <CheckCircle2 size={48} className="text-green-600 mb-4" />
                  <h3 className="text-lg font-bold text-green-900">Baseline Established & Active</h3>
                  <p className="text-sm text-green-700 max-w-xl mt-2 mb-8 leading-relaxed">
                    Your agency's document fingerprint has been securely analyzed and stored. 
                    The Ahani AI is actively using this profile to verify official documents scanned by citizens—cross-referencing structural layouts, agency identifiers, and standard wording to prevent fraud, while safely ignoring personal information.
                  </p>
                  
                  <div className="border-t border-green-200/60 pt-6 w-full max-w-md">
                    <h4 className="text-sm font-bold text-green-900 mb-2">Need to update your forms?</h4>
                    <p className="text-xs text-green-700 mb-5">
                      If your agency has issued completely new document templates, you must revoke this profile and train a new one to prevent false rejections.
                    </p>
                    <button 
                      onClick={handleRevoke}
                      disabled={isRevoking}
                      className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold px-6 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto w-full"
                    >
                      {isRevoking ? <RefreshCw className="animate-spin" size={18} /> : <Ban size={18} />}
                      {isRevoking ? 'Revoking Profile...' : 'Revoke Profile & Create New'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud size={48} className="text-blue-500 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">Establish Baseline Fingerprint</h3>
                  <p className="text-sm text-slate-500 max-w-lg mt-2 mb-6 leading-relaxed">
                    Upload up to 5 clear images of your official agency documents. Our AI will analyze them to create a structural fingerprint, ensuring citizens scan the correct forms.
                  </p>
                  
                  {/* The Actual Form */}
                  <form action={establishBaselineFingerprint} onSubmit={() => setIsUploading(true)} className="w-full max-w-md">
                    
                    <input type="hidden" name="agencyId" value={agencyId} />

                    {/* Hidden file input */}
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      name="files" 
                    />

                    {/* File preview list */}
                    {selectedFiles.length > 0 && (
                      <div className="mb-6 space-y-2 text-left">
                        {selectedFiles.map((file, i) => (
                          <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                            <span className="truncate max-w-[200px] text-slate-700 font-medium">{file.name}</span>
                            <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:bg-red-50 p-1 rounded transition">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 justify-center">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-slate-100 text-slate-700 border border-slate-300 font-bold px-6 py-3 rounded-xl hover:bg-slate-200 transition">
                        Browse Files
                      </button>
                      
                      {selectedFiles.length > 0 && (
                        <button type="submit" disabled={isUploading} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
                          {isUploading ? <RefreshCw className="animate-spin" size={18} /> : null}
                          {isUploading ? 'Analyzing AI...' : 'Submit to AI'}
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QR LIFECYCLE MANAGEMENT */}
      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6">
              <QrCode size={120} className="text-slate-900" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Main Lobby & Mailers</h2>
            <p className="text-sm text-slate-500 mb-2">ID: <span className="font-mono bg-slate-100 px-1">qr_88a7b9</span></p>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-6">Status: Active Routing</span>
            
            <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition mb-3">
              Download PNG / SVG
            </button>
            <button className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition flex justify-center items-center gap-2">
              <FileText size={18} /> Print Poster Template
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Lifecycle Controls</h3>
            
            <div 
              onClick={() => setActiveTab('fingerprint')}
              className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center hover:border-blue-300 transition cursor-pointer"
            >
              <div className="flex gap-4 items-center">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Link2 size={24} /></div>
                <div>
                  <h4 className="font-bold text-slate-900">Reassign QR Code</h4>
                  <p className="text-xs text-slate-500">Edit QR code to a different fingerprint. (Requires new 5-document scan).</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center hover:border-orange-300 transition cursor-pointer">
              <div className="flex gap-4 items-center">
                <div className="bg-orange-50 p-3 rounded-lg text-orange-600"><RefreshCw size={24} /></div>
                <div>
                  <h4 className="font-bold text-slate-900">Rotate & Regenerate</h4>
                  <p className="text-xs text-slate-500">Issue a new QR ID. Previous code remains active for 30 days.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-red-200 flex justify-between items-center hover:bg-red-50 transition cursor-pointer">
              <div className="flex gap-4 items-center">
                <div className="bg-red-100 p-3 rounded-lg text-red-600"><Ban size={24} /></div>
                <div>
                  <h4 className="font-bold text-red-900">Revoke Immediately</h4>
                  <p className="text-xs text-red-700">Kill this QR code immediately due to compromise or abuse.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}