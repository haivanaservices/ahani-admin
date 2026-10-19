'use client';

import { useState, useRef } from 'react';
import { UploadCloud, X, RefreshCw } from 'lucide-react';
import { setupCampaignFingerprint } from '../../../actions';

// --- INVISIBLE PDF TO IMAGE CONVERTER ---
async function convertPdfToImage(file: File): Promise<File> {
  // 1. Dynamically load Mozilla's PDF.js without requiring an npm install
  if (!(window as any).pdfjsLib) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // 2. Read the PDF into memory
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  // 3. Grab the first page and scale it up 2x for high-res AI reading
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 }); 

  // 4. Draw it to a hidden browser canvas
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  await page.render({ canvasContext: ctx, viewport }).promise;

  // 5. Convert the canvas back into a standard JPEG File object
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
  return new File([blob], file.name.replace('.pdf', '.jpg'), { type: 'image/jpeg' });
}

export default function SetupClient({ campaignId, campaignName }: { campaignId: string; campaignName: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncNativeInput = (files: File[]) => {
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsProcessingPdf(true);
      const newFiles = Array.from(e.target.files);
      const processedFiles: File[] = [];

      for (const file of newFiles) {
        if (file.type === 'application/pdf') {
          try {
            // Secretly convert PDF to JPG before it ever hits the server
            const imageFile = await convertPdfToImage(file);
            processedFiles.push(imageFile);
          } catch (err) {
            console.error("PDF conversion failed", err);
            processedFiles.push(file); // Fallback
          }
        } else {
          processedFiles.push(file);
        }
      }

      const combinedFiles = [...selectedFiles, ...processedFiles].slice(0, 5);
      
      setSelectedFiles(combinedFiles);
      syncNativeInput(combinedFiles);
      setIsProcessingPdf(false);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    syncNativeInput(updatedFiles);
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 border-dashed max-w-2xl mx-auto mt-8">
      <div className="flex flex-col items-center justify-center text-center">
        <UploadCloud size={48} className="text-purple-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Upload Samples for {campaignName}</h3>
        <p className="text-sm text-slate-500 max-w-lg mt-2 mb-6 leading-relaxed">
          Upload exactly 5 clear images or PDFs of this specific document type. Our system will extract the visual blueprint so the mobile app can verify real scans in the field.
        </p>
        
        <form action={setupCampaignFingerprint} onSubmit={() => setIsUploading(true)} className="w-full max-w-md">
          <input type="hidden" name="campaignId" value={campaignId} />
          
          <input 
            type="file" 
            multiple 
            accept="image/*, application/pdf"
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            name="files" 
          />

          {selectedFiles.length > 0 && (
            <div className="mb-6 space-y-2 text-left">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                  <span className="truncate max-w-[200px] text-slate-700 font-medium">
                    {/* Visual trick so users don't get confused if the extension changed */}
                    {file.name.replace('.jpg', '.pdf')} 
                  </span>
                  <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:bg-red-50 p-1 rounded transition">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isProcessingPdf}
              className="bg-slate-100 text-slate-700 border border-slate-300 font-bold px-6 py-3 rounded-xl hover:bg-slate-200 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessingPdf ? <RefreshCw className="animate-spin" size={18} /> : null}
              {isProcessingPdf ? 'Converting PDFs...' : `Browse Files (${selectedFiles.length}/5)`}
            </button>
            
            {selectedFiles.length === 5 && (
              <button type="submit" disabled={isUploading || isProcessingPdf} className="bg-purple-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2">
                {isUploading ? <RefreshCw className="animate-spin" size={18} /> : null}
                {isUploading ? 'Analyzing Document Structure...' : 'Establish Document Baseline'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}